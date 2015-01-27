var clkstester = require('../index.js'),
    ignoreList = [
                  '/resources.json', 
    	          '/index\.html|\/css\/?.*|\/lib\/?.*|\/images\/?.*|\.js/'
		 ],
    pathAndParams = {
    "GET": [
        {
            "path": "/acs/{id}",
            "parameters": [
                {
                    "name": "id",
                    "description": "id of path",
                    "required": true,
                    "dataType": "string",
                    "paramType": "path"
                }
            ]
        },
        {
            "path": "/acs/{id}/getit/{here}",
            "parameters": [
                {
                    "name": "id",
                    "description": "id of path",
                    "required": true,
                    "dataType": "string",
                    "paramType": "path"
                },
                {
                    "name": "here",
                    "description": "here of path",
                    "required": true,
                    "dataType": "string",
                    "paramType": "path"
                }
            ]
        }
    ],
    "POST": [
        {
            "path": "/offload",
            "parameters": []
        }
    ],
    "PUT": [],
    "DELETE": [],
    "HEAD": []
    },
    pathAndParamsFromServer = {
	"GET": {
            "/acs/{id}": {
		"desc": "This is the desc",
		"params": {
                    "{id}": {
			"desc": "This is id",
			"dataType": "string"
                    }
		}
            },
            "/acs/{id}/hi/{there}": {
		"desc": "This is a desc",
		"params": {
                    "{id}": {
			"desc": "Id of String",
			"dataType": "string"
                    },
                    "{there}": {
			"desc": "There params",
			"dataType": "integer"
                    }
		}
            }
	},
	"POST": {}
    }

describe("CLKS Swagger layer tester...!", function() {

    it("Exist in ignoreList", function() {
	var inIgLst = clkstester.inIgnoreList('/resources.json', ignoreList)
	expect(inIgLst).toBe(true)
    })

    it("Does not exist in ignoreList", function() {
	var inIgLst = clkstester.inIgnoreList('/resource/create', ignoreList)
	expect(inIgLst).toBe(false)
    })

    it("Generate params for swagger - GET with one param", function() {
	var paramsObj = clkstester.generateParamsForSwagger('GET','/acs/:id')
	expect(paramsObj).toEqual(pathAndParams['GET'][0])
    })

    it("Generate params for swagger - GET with two params", function() {
	var paramsObj = clkstester.generateParamsForSwagger('GET','/acs/:id/getit/:here')
	expect(paramsObj).toEqual(pathAndParams['GET'][1])
    })

    it("Generate params for swagger - POST without params", function() {
	var paramsObj = clkstester.generateParamsForSwagger('POST','/offload')
	expect(paramsObj).toEqual(pathAndParams['POST'][0])
    })

    it("Get parameters for path", function() {
	var paramsObj = clkstester.getParametersForThePath('GET','/acs/:id')
	expect(paramsObj).toEqual(pathAndParams['POST'][0].parameters)
    })





})
