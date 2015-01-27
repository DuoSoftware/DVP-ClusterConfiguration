var swagger       = require('swagger-doc'),
    restify       = require('restify'),
    express       = require('express'),
    filePath      = require('path'),
    fs            = require('fs'),
    docs,
    ignoreList    = [
                      '/resources.json', 
    	              '/api-docs\.html|\/css\/?.*|\/lib\/?.*|\/images\/?.*|\.js/'
		    ],
    pathAndParams = {"GET":[],"POST":[],"PUT":[],"DELETE":[],"HEAD":[]},
    swaggerParamsFromServer = {};

function getServerName(serverName) {
    var serverLib = swaggerParamsFromServer.server || 'restify';
    return ((serverLib + '') === serverName)
}

function getHttpPathArray(serverObj) {
    var routesList = [];    

    if (getServerName('restify')) {
	routesList =  serverObj.router.routes
    } else {
	routesList = serverObj.routes
    }

    return routesList
}

function getHttpPathFromPathAry(httpPathAry, httpMethod, id) {
    var strPath   = '';

    if (getServerName('restify')) {
	strPath =  httpPathAry[httpMethod][id].spec.path + ''
    } else {
	strPath = httpPathAry[httpMethod.toLowerCase()][id].path + ''
    }
    
    return strPath
}

function getLengthOfHttpPathsFromPathAry(httpPathAry, httpMethod) {
    if (getServerName('restify')) {
	return httpPathAry[httpMethod].length
    } else {
	return httpPathAry[httpMethod.toLowerCase()].length
    }
}

function addToSwaggerDocs(httpMethod, docs, serverObj) {
    var httpMethod  = httpMethod || 'GET',
        httpPathAry = getHttpPathArray(serverObj),
        hLength     = getLengthOfHttpPathsFromPathAry(httpPathAry, httpMethod),
        path        = '',
        paramsObj;

    for (var idx = 0; idx < hLength; idx++) {
            path = getHttpPathFromPathAry(httpPathAry, httpMethod, idx)
	    if ((inIgnoreList(path, ignoreList) === false) && (path.indexOf('?') < 0))  {
                paramsObj = generateParamsForSwagger(httpMethod, path) 
                pathAndParams[httpMethod].push(paramsObj)		
		if (!(inIgnorePaths(httpMethod, paramsObj.path))) {
		    addRestOptionsToDoc(httpMethod, paramsObj.path, docs)		    
		}
	    }
    }

}

function inIgnorePaths(httpMethod, httpPath) {
    return ((swaggerParamsFromServer.ignorePaths) && 
    	    (swaggerParamsFromServer.ignorePaths[httpMethod]) && 
    	    (swaggerParamsFromServer.ignorePaths[httpMethod].indexOf(httpPath) >= 0))
}

function addRestOptionsToDoc(httpMethod, restPath, docs) {
    if (httpMethod === 'GET') {
	docs.get(restPath, restPath, {notes: restPath, nickname: restPath, parameters: getParametersForThePath('GET', restPath)})	
    } else if (httpMethod === 'POST') {
	docs.post(restPath, restPath, {notes: restPath, nickname: restPath, parameters: getParametersForThePath('POST', restPath)})
    } else if (httpMethod === 'PUT') {
        docs.put(restPath, restPath, {notes: restPath, nickname: restPath, parameters: getParametersForThePath('PUT', restPath)})
    }
}

function getParametersForThePath(httpMethod, restPath) {
    var parameters = [];

    pathAndParams[httpMethod].map(function(val, idx, ary) {
	if (val.path === restPath) {
	    parameters = val.parameters
	}
    })

    return parameters
}

function inIgnoreList(path, ignoreList) {
    var found    = false,
        igLength = ignoreList.length,
        httpPath = path;

    for (var idx = 0; idx < igLength; idx++) {
    	if ((httpPath === ignoreList[idx]) || (httpPath.replace(/\\/g,"") === ignoreList[idx])) {  // unescape is handled
    	    found = true
    	    break
    	}
    }

    return found
}

function generateParamsForSwagger(httpMethod, path) {
    var reg = /:(.+?)\b/g,
        replacedStr = '',
        parameters = [];

    replacedStr = path.replace(reg, function(str) { 
        str = str.replace(/:/g, "")
    	parameters.push({name: str, description: str + " of path", required:true, dataType: "string", paramType: "path"})
    	return "{" + str + "}" 
    	})
   
    return {'path' : replacedStr, 'parameters' : parameters}
}

function extendObject(object, inheritFromObj) {
    for (i in inheritFromObj) {
	object[i] = inheritFromObj[i]
    }
    return object
}

function bootStrap(serverObj) {

    var distPath = __dirname + '/node_modules/swagger-ui/dist';
    var basePathResource  = swaggerParamsFromServer.basePath + '/' + swaggerParamsFromServer.resourceName;
    var windowLocationHref = swaggerParamsFromServer.basePath + '/api-docs.html#!/' + swaggerParamsFromServer.resourceName;
    var fileStr = '';

    console.log('[Resource path : ' + basePathResource  +']')

    fs.exists(distPath + '/index.html', function(exists) {
	if (exists) {
	    fs.rename(distPath + '/index.html', distPath + '/api-docs.html', function(err) {
		if (err) { console.log('Error...could not rename resource.')}
		console.log('Renamed the resource successfully.')
	    })
	}
    })

    fs.exists(__dirname + '/template/api-docs.html', function(exists) {
	if (exists) {
	    fs.readFile(__dirname + '/template/api-docs.html', 'utf8', function(err, data) {
		fileStr = data
		fileStr = fileStr.replace(/BASE_PATH_RESOURCE/g, basePathResource)
		fileStr = fileStr.replace(/WINDOW_LOCATION_HREF/g, windowLocationHref)
		
		fs.writeFile(distPath + '/api-docs.html', fileStr, 'utf8', function(err) {
		    if (err) { throw new Error() }
		    console.log('[Base path resource and window location updated]')
		})

	    })
	}
    })

    if (getServerName('express')) {

	serverObj.use(express.static(distPath))

	serverObj.get('/index.html', function(req,res) {
	    res.send({message : 'Invalid Request'})
	}) 

        serverObj.get('/api-docs.html', function(req, res) {
	    res.sendfile(distPath + '/api-docs.html')
	})
        ignoreList.push('/api-docs.html')

    } else {

	serverObj.get(/api-docs\.html|\/css\/?.*|\/lib\/?.*|\/images\/?.*|\.js/, restify.serveStatic({
	    'directory': distPath
	}))	

    }
    
}

exports.getParametersForThePath = getParametersForThePath
exports.generateParamsForSwagger = generateParamsForSwagger
exports.inIgnoreList = inIgnoreList

exports.init = function(serverObj, swaggerParams) {

    swaggerParamsFromServer =  extendObject(swaggerParamsFromServer, swaggerParams)
    bootStrap(serverObj)

    if ((swaggerParams.basePath === undefined) || (swaggerParams.basePath.trim() === '')) {
	console.log('[CRITICAL ERROR - basePath param for swagger-restify-express is not defined.]')
    } else {
	swagger.configure(serverObj, {
	    version: "0.1",
            basePath: swaggerParams.basePath
	})

	docs = swagger.createResource("/" + swaggerParams.resourceName)
	ignoreList.push("/" + swaggerParams.resourceName)

	for (var i = 0; i < swaggerParams.httpMethods.length; i++) {
	    addToSwaggerDocs(swaggerParams.httpMethods[i] + '' , docs, serverObj)
	}	

	console.log('[Wired swagger with the following params.]')	
	console.log(JSON.stringify(pathAndParams));

    }

}


