var datahandler = require('./DVP-Common/CSORMModels/ClusterConfigurationDataHandler.js');


function CreateCluster(req, res, next) {

    var obj=req.body;

    if(obj){
        var result = datahandler.CreateCloud(obj);


    }
    else{

        console.log("obj is null in CreateCluster");

    }

    try {

        res.send(result);
        res.close();
        res.end();
        return next();
    }
    catch(exp){

        console.log("There is a error in --> CreateCluster ", exp)

    }
}




function AddLoadBalancer(req, res, next) {

    var obj=req.body;

    if(obj){
        var result = datahandler.LoadBalancer(obj);


    }
    else{

        console.log("obj is null in AddLoadBalancer");

    }

    try {

        res.send(result);
        res.close();
        res.end();
        return next();
    }
    catch(exp){

        console.log("There is a error in AddLoadBalancer --> ", exp)

    }
}


function CreateDB(){

    datahandler.CreateDB();
}

module.exports.CreateCluster = CreateCluster;
module.exports.AddLoadBalancer = AddLoadBalancer;
module.exports.CreateDB = CreateDB;