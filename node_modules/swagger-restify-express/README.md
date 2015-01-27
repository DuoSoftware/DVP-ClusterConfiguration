swagger-restify-express
=========
<br>
This package will automagically wire your restify and express paths to swagger framework.
<br><br>

#### Make sure that your REST library is "restify"
```console
npm install restify
var restify =  require('restify')
```
<br>

#### Include swagger-restify-express in your project.
```console
sre = require('swagger-restify-express')
```
<br>

#### Have the restify server running
```console
var server = restify.createServer({
  name:"My REST server"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));

server.get('/xxx/:id', function(req, res) {
  res.send('hello from my REST server ' + req.params.name);
});

server.get('/xxx/:id/getit/:here', function(req, res) {
  res.send('hello from my REST server ' + req.params.name);
});

server.post('/offload', someClass.offload);

sre.init(server, {
		  resourceName : 'swag',
		  server : 'restify', // or express
		  httpMethods : ['GET', 'POST'],
		  basePath : 'https://yourdomain.com',
		  ignorePaths : {
		  	      GET : ['path1', 'path2'],
			      POST : ['path1']
		  }
		}
       )

server.listen(3000, function() {
  console.log('%s listening at %s', server.name, server.url);
});
```
<br>
#### Make sure that you add the line, so that the auto wiring is done.
```console
sre.init(server, {
		  resourceName : 'swag',
		  server : 'restify', // or express
		  httpMethods : ['GET', 'POST'],
		  basePath : 'https://yourdomain.com',  // MANDATORY
		  ignorePaths : {
		  	      GET : ['path1', 'path2'],
			      POST : ['path1']
		  }
		}
       )
```

<br>
#### Crank up your server
```sh
node app.js
```
<br>
#### Open up your browser
```sh
http://localhost:3000/api-docs.html
```


![alt tag](https://raw.githubusercontent.com/manojkumarmc/swagger-restify-express/master/swagger-ui.jpg)




 
  
   
   
  
