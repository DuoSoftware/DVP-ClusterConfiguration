/**
 * Created by a on 1/27/2015.
 */
var restify = require('restify');
var sre = require('swagger-restify-express');
var http = require('http');
var winston = require('winston');
var restMessageHandler = require('./RESTMessageHandler.js');
//var format = require('stringformat');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';





//console.log(process.env);

/*
var customLevels = {
    levels: {
        debug: 0,
        info: 1,calc
        warn: 2,
        error: 3
    },
    colors: {
        debug: 'blue',
        info: 'green',
        warn: 'yellow',
        error: 'red'
    }
};

var logger = new(winston.Logger)({
    level: 'debug',
    levels: customLevels.levels,
    transports: [
        // setup console logging
        new(winston.transports.Console)({
            level: 'info', // Only write logs of info level or higher
            levels: customLevels.levels,
            colorize: true
        })
    ]
});


winston.addColors(customLevels.colors);


//logger.info('Hello distributed log files!');
//logger.error('Hello distributed log files!');
//logger.warn('Hello distributed log files!');
//restHandler.CreateDB();
*/

var server = restify.createServer({
    name: "DVP Cluster Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));

restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());


//////////////////////////////Cloud API/////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/Cloud', restMessageHandler.CreateCluster);

server.post('/DVP/API/:version/CloudConfiguration/Cloud/:id/Activate/:status', function( req, res, next){

    restMessageHandler.ActivateCloud(res,req.params.id,req.params.status);
    return next();
});


server.get('/DVP/API/:version/CloudConfiguration/Cloud/:id', function( req, res, next){
    restMessageHandler.GetClusterByID(res, req.params.id);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/Clouds', function( req, res, next){
    restMessageHandler.GetClusters(req, res);
    return next();
} );


///////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////CallServer API///////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/CallServer', restMessageHandler.CreateCallServer);


server.post('/DVP/API/:version/CloudConfiguration/CallServer/:id/Activate/:status', function( req, res, next){

    restMessageHandler.ActivateCallServer(res,req.params.id,req.params.status);
    return next();
});


server.get('/DVP/API/:version/CloudConfiguration/CallServer/:id', function( req, res, next){
    restMessageHandler.GetCallServerByID(res, req.params.id);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/CallServers', function( req, res, next){
    restMessageHandler.GetCallServers(req,res);
    return next();
} );

server.post('/DVP/API/:version/CloudConfiguration/CallServer/:id/AssignTo/:cloudid',function( req, res, next){
    restMessageHandler.AddCallServerToCloud(res, req.params.id,req.params.cloudid);
    return next();
} );

//////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////Virtual cluster API///////////////////////////////////////


server.post('/DVP/API/:version/CloudConfiguration/Cloud/:childid/SetParent/:parentid',function( req, res, next){
    restMessageHandler.SetParentCloud(res, req.params.childid,req.params.parentid);
    return next();
} );

///////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////LoadBalancer API////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/LoadBalancer',function( req, res, next){
    restMessageHandler.AddLoadBalancer(res, req);
    return next();
} );

//////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////Network API//////////////////////////////////////////////////////


server.post('/DVP/API/:version/CloudConfiguration/Network/TelcoNetwork',function( req, res, next){
    restMessageHandler.CreateTelcoNetwork(res, req);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Network/UserNetwork',function( req, res, next){
    restMessageHandler.CreateEndUserNetwork(res, req);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Network/:networkid/SetTelcoNetworkToCloud/:cloudid',function( req, res, next){
    restMessageHandler.SetTelcoNetworkToCloud(res,req.params.networkid,req.params.cloudid);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Network/:networkid/SetTelcoNetworkToUser/:userid',function( req, res, next){
    restMessageHandler.SetTelcoNetworkToUSer(res,req.params.networkid,req.params.userid);
    return next();
} );



server.get('/DVP/API/:version/CloudConfiguration/Networks', function( req, res, next){
    restMessageHandler.GetNetworks(req,res);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/NetworksByClusterID/:id', function( req, res, next){
    restMessageHandler.GetNetworkByClusterID(req, res, req.params.id);
    return next();
} );

////////////////////////////////////////////////////////////////////////////////////////////////





////////////////////////////////////User ////////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/CloudEndUser',function( req, res, next){
    restMessageHandler.CreateEndUser(res, req);
    return next();
} );

server.get('/DVP/API/:version/CloudConfiguration/CloudEndUsers', function( req, res, next){
    restMessageHandler.GetEndUsers(req, res);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/CloudEndUserByClusterID/:id', function( req, res, next){
    restMessageHandler.GetEndUsersByClusterID(req, res,req.params.id);
    return next();
} );



////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////profile////////////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/Profile',function( req, res, next){
    restMessageHandler.CreateSipProfile(res, req);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Profile/:profileid/SetProfileToCallServer/:callserverid',function( req, res, next){
    restMessageHandler.AssignSipProfileToCallServer(res,req.params.profileid,req.params.callserverid);
    return next();
} );



server.post('/DVP/API/:version/CloudConfiguration/Profile/:profileid/SetProfileToEndUser/:enduser',function( req, res, next){
    restMessageHandler.AssignSipProfiletoEndUser(res,req.params.profileid,req.params.enduser);
    return next();
} );

server.get('/DVP/API/:version/CloudConfiguration/Profile/:id', function( req, res, next){
    restMessageHandler.GetProfileByID(res, req.params.id);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/Profiles', function( req, res, next){
    restMessageHandler.GetProfiles(req,res);
    return next();
} );

////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////StoreIPAddressDetails/////////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/IPAddress',function( req, res, next){
    restMessageHandler.StoreIPAddressDetails(res, req);
    return next();
} );

////////////////////////////////////////////////////////////////////////////////////////////////////

var basepath = 'http://'+ host;
//var basepath = 'http://'+ "localhost"+":"+port;

//var basepath = 'http://duosoftware-dvp-clusterconfigu.104.131.90.110.xip.io';

sre.init(server, {
        resourceName : 'CloudConfigurationService',
        server : 'restify', // or express
        httpMethods : ['GET', 'POST', 'PUT', 'DELETE'],
        basePath : basepath,
        ignorePaths : {
            GET : ['path1', 'path2'],
            POST : ['path1']
        }
    }
)

server.listen(port, function () {



    logger.info("DVP-ClusterConfiguration.main Server %s listening at %s", server.name, server.url);
    //console.log('%s listening at %s', server.name, server.url);
});


