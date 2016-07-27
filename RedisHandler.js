var redis = require("redis");
var Config = require('config');
var Redlock = require('redlock');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var dbmodel = require('dvp-dbmodels');

var redisIp = Config.Redis.ip;
var redisPort = Config.Redis.port;
var password = Config.Redis.password;

var client = redis.createClient(redisPort, redisIp);

client.auth(password, function (error) {
    console.log("Redis Auth Error : "+error);
});
client.on("error", function (err) {
    console.log("Error " + err);

});

var redlock = new Redlock(
    [client],
    {
        driftFactor: 0.01,
        retryCount:  3,
        retryDelay:  200
    }
);

var redisCallback = function(err, resp)
{

};

redlock.on('clientError', function(err)
{
    logger.error('[DVP-ClusterConfiguration.AcquireLock] - [%s] - REDIS LOCK FAILED', err);

});

var addClusterToCache = function(clusterId)
{
    var ttl = 2000;
    var lockKey = 'CLOUDLOCK:' + clusterId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {

        dbmodel.Cloud.find({where: [{id: clusterId}], include: [{model: dbmodel.LoadBalancer, as: "LoadBalancer"}]})
            .then(function (cloudRec)
            {
                if (cloudRec)
                {
                    client.set('CLOUD:' + clusterId, JSON.stringify(cloudRec), function(err, setResp)
                    {
                        lock.unlock()
                            .catch(function(err) {
                                logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                            });
                    });
                }
                else
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });
                }

            }).catch(function(err)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            });
    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addClusterToCache] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });

};

var checkAndSetCallServerToCompanyObj = function(newCsObj, tenantId, companyId)
{
    var ttl = 2000;

    var lockKey = 'DVPCACHELOCK:' + tenantId + ':' + companyId;

    var key = 'DVPCACHE:' + tenantId + ':' + companyId;

    redlock.lock(lockKey, ttl).then(function(lock)
    {
        client.get(key, function(err, compStr)
        {
            var compObj = {};
            if(compStr)
            {
                try
                {
                    compObj = JSON.parse(compStr);
                }
                catch(ex)
                {
                    compObj = {};

                }

            }

            if(!compObj.CallServer)
            {
                compObj.CallServer = {};
            }

            compObj.CallServer[newCsObj.id] = newCsObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.checkAndSetCallServerToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var SetObject = function(key, value, callback)
{
    try
    {

        client.set(key, value, function(err, response)
        {
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, undefined);
    }

};

var DeleteObject = function(key, callback)
{
    try
    {
        client.del(key, function(err, response)
        {
            callback(err, response);
        });

    }
    catch(ex)
    {
        callback(ex, null);
    }

};





module.exports.SetObject = SetObject;
module.exports.DeleteObject = DeleteObject;
module.exports.checkAndSetCallServerToCompanyObj = checkAndSetCallServerToCompanyObj;
module.exports.addClusterToCache = addClusterToCache;