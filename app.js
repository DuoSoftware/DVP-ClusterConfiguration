/**
 * Created by a on 1/27/2015.
 */
var restify = require('restify');
var sre = require('swagger-restify-express');
var http = require('http');
//var winston = require('winston');
var restMessageHandler = require('./RESTMessageHandler.js');
//var format = require('stringformat');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';
var jwt = require('restify-jwt');
var secret = require('dvp-common/Authentication/Secret.js');
var authorization = require('dvp-common/Authentication/Authorization.js');




var server = restify.createServer({
    name: "DVP Cluster Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));

restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());

server.use(jwt({secret: secret.Secret}));


//////////////////////////////Cloud API/////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/Cloud',authorization({resource:"cluster", action:"write"}), function(req, res, next) {

        restMessageHandler.CreateCluster(req, res);
        return next();
    });

server.post('/DVP/API/:version/CloudConfiguration/Cloud/:id/Activate/:status',authorization({resource:"cluster", action:"write"}), function( req, res, next){

    restMessageHandler.ActivateCloud(req, res,req.params.id,req.params.status);
    return next();
});


server.get('/DVP/API/:version/CloudConfiguration/Cloud/:id',authorization({resource:"cluster", action:"read"}), function( req, res, next){
    restMessageHandler.GetClusterByID(req,res, req.params.id);
    return next();
} );

server.get('/DVP/API/:version/CloudConfiguration/Cloud/:id/ActiveCallservers',authorization({resource:"cluster", action:"read"}), function( req, res, next){
    restMessageHandler.GetActiveCallserversByClusterID(req, res);
    return next();
} );




server.put('/DVP/API/:version/CloudConfiguration/Cloud/:id',authorization({resource:"cluster", action:"write"}), function( req, res, next){
    restMessageHandler.EditCluster(req.params.id,req,res);
    return next();
} );


//,
server.get('/DVP/API/:version/CloudConfiguration/Clouds',authorization({resource:"cluster", action:"read"}), function( req, res, next){
    restMessageHandler.GetClusters(req, res);
    return next();
} );


///////////////////////////////////////////////////////////////////////////////////////////



//////////////////////////////CallServer API///////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/CallServer',authorization({resource:"callserver", action:"write"}), function( req, res, next){

        restMessageHandler.CreateCallServer(res,req);
        return next();
    });


server.post('/DVP/API/:version/CloudConfiguration/CallServer/UniqueCode',authorization({resource:"callserver", action:"write"}), function( req, res, next){

    restMessageHandler.UniqueCode(res,req);
    return next();
});


server.put('/DVP/API/:version/CloudConfiguration/CallServer/:id',authorization({resource:"callserver", action:"write"}), function( req, res, next){
    restMessageHandler.EditCallServer(req.params.id,req,res);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/CallServer/:id/Activate/:status',authorization({resource:"callserver", action:"write"}), function( req, res, next){

    restMessageHandler.ActivateCallServer(req, res, req.params.id, req.params.status);
    return next();
});


server.get('/DVP/API/:version/CloudConfiguration/CallServer/:id',authorization({resource:"callserver", action:"read"}), function( req, res, next){
    restMessageHandler.GetCallServerByID(req, res, req.params.id);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/CallServers',authorization({resource:"callserver", action:"read"}), function( req, res, next){
    restMessageHandler.GetCallServers(req,res);
    return next();
} );

server.post('/DVP/API/:version/CloudConfiguration/CallServer/:id/AssignTo/:cloudid',authorization({resource:"callserver", action:"write"}),function( req, res, next){
    restMessageHandler.AddCallServerToCloud(req, res, req.params.id,req.params.cloudid);
    return next();
} );


server.del('/DVP/API/:version/CloudConfiguration/CallServer/:id/AssignTo/:cloudid',authorization({resource:"callserver", action:"delete"}),function( req, res, next){
    restMessageHandler.RemoveCallServerFromCloud(req, res, req.params.id,req.params.cloudid);
    return next();
} );

server.get('/DVP/API/:version/CloudConfiguration/CallserversByCompany/',authorization({resource:"callserver", action:"read"}),function(req, res, next)
{
    restMessageHandler.GetCallServersForCompany(req, res);
    return next();
} );

//////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////Virtual cluster API///////////////////////////////////////


server.post('/DVP/API/:version/CloudConfiguration/Cloud/:childid/SetParent/:parentid',authorization({resource:"cluster", action:"write"}),function( req, res, next){
    restMessageHandler.SetParentCloud(req, res, req.params.childid, req.params.parentid);
    return next();
} );



///////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////LoadBalancer API////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/LoadBalancer',authorization({resource:"cluster", action:"write"}),function( req, res, next){
    restMessageHandler.AddLoadBalancer(res, req);
    return next();
} );

//////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////Network API//////////////////////////////////////////////////////


server.post('/DVP/API/:version/CloudConfiguration/Network/TelcoNetwork',authorization({resource:"network", action:"write"}),function( req, res, next){
    restMessageHandler.CreateTelcoNetwork(res, req);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Network/UserNetwork',authorization({resource:"network", action:"write"}),function( req, res, next){
    restMessageHandler.CreateEndUserNetwork(res, req);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Network/:networkid/SetTelcoNetworkToCloud/:cloudid',authorization({resource:"network", action:"write"}),function( req, res, next){
    restMessageHandler.SetTelcoNetworkToCloud(req,res,req.params.networkid,req.params.cloudid);
    return next();
} );


server.del('/DVP/API/:version/CloudConfiguration/Network/:networkid/SetTelcoNetworkToCloud/:cloudid',authorization({resource:"network", action:"delete"}),function( req, res, next){
    restMessageHandler.RemoveTelcoNetworkFromCloud(req,res,req.params.networkid,req.params.cloudid);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Network/:networkid/SetTelcoNetworkToUser/:userid',authorization({resource:"network", action:"write"}),function( req, res, next){
    restMessageHandler.SetTelcoNetworkToUSer(req,res,req.params.networkid,req.params.userid);
    return next();
} );


server.del('/DVP/API/:version/CloudConfiguration/Network/:networkid/SetTelcoNetworkToUser/:userid',authorization({resource:"network", action:"delete"}),function( req, res, next){
    restMessageHandler.RemoveTelcoNetworkFromUser(req,res,req.params.networkid,req.params.userid);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/Networks',authorization({resource:"network", action:"read"}), function( req, res, next){
    restMessageHandler.GetNetworks(req,res);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/Network/:id', authorization({resource:"network", action:"read"}),function( req, res, next){
    restMessageHandler.GetNetwork(req.params.id,req,res);
    return next();
} );


server.put('/DVP/API/:version/CloudConfiguration/Network/:id', authorization({resource:"network", action:"write"}),function( req, res, next){
    restMessageHandler.EditNetwork(req.params.id,req,res);
    return next();
} );


server.del('/DVP/API/:version/CloudConfiguration/Network/:id', authorization({resource:"network", action:"delete"}),function( req, res, next){
    restMessageHandler.DeleteNetwork(req.params.id,req,res);
    return next();
} );



server.get('/DVP/API/:version/CloudConfiguration/NetworksByClusterID/:id', authorization({resource:"network", action:"read"}),function( req, res, next){
    restMessageHandler.GetNetworkByClusterID(req, res, req.params.id);
    return next();
} );

////////////////////////////////////////////////////////////////////////////////////////////////





////////////////////////////////////User ////////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/CloudEndUser',authorization({resource:"enduser", action:"write"}),function( req, res, next){
    restMessageHandler.CreateEndUser(res, req);
    return next();
} );

// Pawan
server.put('/DVP/API/:version/CloudConfiguration/CloudEndUser/:id',authorization({resource:"enduser", action:"write"}),function( req, res, next){
    restMessageHandler.UpdateEndUser(res, req);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/CloudEndUser/:id',authorization({resource:"enduser", action:"read"}),function( req, res, next){
    restMessageHandler.GetEndUser(req.params.id, req, res);
    return next();
} );

// Pawan
server.del('/DVP/API/:version/CloudConfiguration/CloudEndUser/:id',authorization({resource:"enduser", action:"delete"}),function( req, res, next){
    restMessageHandler.DeleteEndUser(req, res, req.params.id);
    return next();
} );

server.get('/DVP/API/:version/CloudConfiguration/CloudEndUsers', authorization({resource:"enduser", action:"read"}),function( req, res, next){
    restMessageHandler.GetEndUsers(req, res);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/CloudEndUserByClusterID/:id', authorization({resource:"enduser", action:"read"}),function( req, res, next){
    restMessageHandler.GetEndUsersByClusterID(req, res,req.params.id);
    return next();
} );

server.post('/DVP/API/:version/CloudConfiguration/BlacklistNumber', authorization({resource:"enduser", action:"write"}),function( req, res, next){
    restMessageHandler.AddNumberToBlacklist(req, res);
    return next();
} );

server.del('/DVP/API/:version/CloudConfiguration/BlacklistNumber/:id', authorization({resource:"enduser", action:"delete"}),function( req, res, next){
    restMessageHandler.RemoveNumberFromBlacklist(req, res);
    return next();
} );

server.get('/DVP/API/:version/CloudConfiguration/BlacklistNumbers', authorization({resource:"enduser", action:"read"}),function( req, res, next){
    restMessageHandler.GetNumbersInBlacklist(req, res);
    return next();
} );



////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////profile////////////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/Profile',authorization({resource:"profile", action:"write"}),function( req, res, next){
    restMessageHandler.CreateSipProfile(res, req);
    return next();
} );


server.post('/DVP/API/:version/CloudConfiguration/Profile/:profileid/SetProfileToCallServer/:callserverid',authorization({resource:"profile", action:"write"}),function( req, res, next){
    restMessageHandler.AssignSipProfileToCallServer(req,res,req.params.profileid,req.params.callserverid);
    return next();
} );



server.post('/DVP/API/:version/CloudConfiguration/Profile/:profileid/SetProfileToEndUser/:enduser',authorization({resource:"profile", action:"write"}),function( req, res, next){
    restMessageHandler.AssignSipProfiletoEndUser(req, res,req.params.profileid,req.params.enduser);
    return next();
} );

server.get('/DVP/API/:version/CloudConfiguration/Profile/:id',authorization({resource:"profile", action:"read"}), function( req, res, next){
    restMessageHandler.GetProfileByID(req, res, req.params.id);
    return next();
} );

server.del('/DVP/API/:version/CloudConfiguration/Profile/:id', authorization({resource:"profile", action:"delete"}),function( req, res, next){
    restMessageHandler.DeleteProfileByID(req.params.id,req,res);
    return next();
} );

server.put('/DVP/API/:version/CloudConfiguration/Profile/:id', authorization({resource:"profile", action:"write"}),function( req, res, next){
    restMessageHandler.UpdateProfileByID(req.params.id,req,res);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/Profiles', authorization({resource:"profile", action:"read"}),function( req, res, next){
    restMessageHandler.GetProfiles(req,res);
    return next();
} );

////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////StoreIPAddressDetails/////////////////////////////////////////////////////////

server.post('/DVP/API/:version/CloudConfiguration/IPAddress',authorization({resource:"profile", action:"write"}),function( req, res, next){
    restMessageHandler.StoreIPAddressDetails(res, req);
    return next();
} );


server.del('/DVP/API/:version/CloudConfiguration/IPAddress/:id',authorization({resource:"profile", action:"delete"}),function( req, res, next){
    restMessageHandler.DeleteIPAddresses(req.params.id, res, req);
    return next();
} );


server.get('/DVP/API/:version/CloudConfiguration/IPAddresses',authorization({resource:"profile", action:"read"}),function( req, res, next){
    restMessageHandler.GetIPAddresses(res, req);
    return next();
} );



////////////////////////////////////////////////////////////////////////////////////////////////////

//var basepath = 'http://'+ host;
var basepath = 'http://'+ "localhost"+":"+port;

//var basepath = 'http://duosoftware-dvp-clusterconfigu.104.131.90.110.xip.io';

/*
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
)*/

server.listen(port, function () {



    logger.info("DVP-ClusterConfiguration.main Server %s listening at %s", server.name, server.url);
    //console.log('%s listening at %s', server.name, server.url);
});


