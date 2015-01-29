var dbmodel = require('./DVP-DBModels');





function CreateCluster(req, res, next) {

    var cloudData=req.body;

    if(cloudData){


        var model = 0;
        var status = 0;

        if(0<cloudData.CloudModel && cloudData.CloudModel<4) {

            console.log("Model is correct ");
            model = cloudData.CloudModel;

        }
        else{

            console.log("Model is incorrect trying private");

        }

        var cloud = dbmodel.Cloud.build({
            Name: cloudData.Name,
            CompanyId: cloudData.CompanyId,
            TenantId: cloudData.TenantId,
            CloudModel: model,
            Class: cloudData.Class,
            Type: cloudData.Type,
            Category: cloudData.Category,
            IsLoadBalanced: cloudData.IsLoadBalanced,
            LoadBalancerID: -1
        })


        cloud
            .save()
            .complete(function(err) {
                if (!!err) {
                    console.log('The cloud instance has not been saved:', err)
                } else {
                    console.log('Cloud have a persisted instance now')
                    status = 1;
                }
            })



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
        //var result = datahandler.LoadBalancer(obj);


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

   // datahandler.CreateDB();
}

module.exports.CreateCluster = CreateCluster;
module.exports.AddLoadBalancer = AddLoadBalancer;
module.exports.CreateDB = CreateDB;