var redis = require("ioredis");
var config = require('config');
var Redlock = require('redlock');
var logger = require('dvp-common-lite/LogHandler/CommonLogHandler.js').logger;
var dbmodel = require('dvp-dbmodels');

var redisip = config.Redis.ip;
var redisport = config.Redis.port;
var redispass = config.Redis.password;
var redismode = config.Redis.mode;
var redisdb = config.Redis.db;



var redisSetting =  {
    port:redisport,
    host:redisip,
    family: 4,
    password: redispass,
    db: redisdb,
    retryStrategy: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: function (err) {

        return true;
    }
};

if(redismode == 'sentinel'){

    if(config.Redis.sentinels && config.Redis.sentinels.hosts && config.Redis.sentinels.port && config.Redis.sentinels.name){
        var sentinelHosts = config.Redis.sentinels.hosts.split(',');
        if(Array.isArray(sentinelHosts) && sentinelHosts.length > 2){
            var sentinelConnections = [];

            sentinelHosts.forEach(function(item){

                sentinelConnections.push({host: item, port:config.Redis.sentinels.port})

            })

            redisSetting = {
                sentinels:sentinelConnections,
                name: config.Redis.sentinels.name,
                password: redispass
            }

        }else{

            console.log("No enough sentinel servers found .........");
        }

    }
}

var client = undefined;

if(redismode != "cluster") {
    client = new redis(redisSetting);
}else{

    var redisHosts = redisip.split(",");
    if(Array.isArray(redisHosts)){


        redisSetting = [];
        redisHosts.forEach(function(item){
            redisSetting.push({
                host: item,
                port: redisport,
                family: 4,
                password: redispass});
        });

        var client = new redis.Cluster([redisSetting]);

    }else{

        client = new redis(redisSetting);
    }


}


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

var addSipProfileToCompanyObj = function(profileObj, tenantId, companyId)
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

            if(!compObj.SipNetworkProfile)
            {
                compObj.SipNetworkProfile = {};
            }

            compObj.SipNetworkProfile[profileObj.id] = profileObj;

            client.set(key, JSON.stringify(compObj), function(err, compObj)
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });

            });
        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
    });
};

var removeSipProfileFromCompanyObj = function(profileId, tenantId, companyId)
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

            if(compObj.SipNetworkProfile && compObj.SipNetworkProfile[profileId])
            {
                delete compObj.SipNetworkProfile[profileId];
                client.set(key, JSON.stringify(compObj), function(err, compObj)
                {
                    lock.unlock()
                        .catch(function(err) {
                            logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                        });

                });
            }
            else
            {
                lock.unlock()
                    .catch(function(err) {
                        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK RELEASE FAILED', err);
                    });
            }


        });

    }).catch(function(err)
    {
        logger.error('[DVP-ClusterConfiguration.addSipProfileToCompanyObj] - [%s] - REDIS LOCK ACQUIRE FAILED', err);
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
module.exports.addSipProfileToCompanyObj = addSipProfileToCompanyObj;
module.exports.addClusterToCache = addClusterToCache;
module.exports.removeSipProfileFromCompanyObj = removeSipProfileFromCompanyObj;
module.exports.redisClient = client;
