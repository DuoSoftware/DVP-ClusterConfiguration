/**
 * Created by a on 1/27/2015.
 */
var restify = require('restify');
var sre = require('swagger-restify-express');
var http = require('http');

var server = restify.createServer({
    name: "DVP Cluster Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));

server.get('/xxx/:id', function (req, res) {
    res.send('hello from my REST server ' + req.params.name);
});

server.get('/xxx/:id/getit/:here', function (req, res) {
    res.send('hello from my REST server ' + req.params.name);
});

//server.post('/offload', someClass.offload);

sre.init(server, {
        resourceName : 'swag',
        server : 'restify', // or express
        httpMethods : ['GET', 'POST'],
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


