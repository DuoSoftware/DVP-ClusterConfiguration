/**
 * Created by a on 1/27/2015.
 */
var restify = require('restify');
var sre = require('swagger-restify-express');
var http = require('http');
var winston = require('winston');
var restMessageHandler = require('./RESTMessageHandler.js');



var customLevels = {
    levels: {
        debug: 0,
        info: 1,
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


var server = restify.createServer({
    name: "DVP Cluster Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));


server.post('/offload', restMessageHandler.CreateCluster);

/*
server.get('/xxx/:id', function (req, res) {
    res.send('hello from my REST server ' + req.params.name);
});

server.get('/xxx/:id/getit/:here', function (req, res) {
    res.send('hello from my REST server ' + req.params.name);
});
*/
//server.post('/offload', someClass.offload);

//server.post();

sre.init(server, {
        resourceName : 'swag',
        server : 'restify', // or express
        httpMethods : ['GET', 'POST', 'PUT', 'DELETE'],
        basePath : 'http://localhost:3000',
        ignorePaths : {
            GET : ['path1', 'path2'],
            POST : ['path1']
        }
    }
)

server.listen(3000, function () {
    console.log('%s listening at %s', server.name, server.url);
});


