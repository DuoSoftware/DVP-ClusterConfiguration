var dbmodel = require('./DVP-DBModels');
var profileHandler = require('./DVP-Common/SipNetworkProfileApi/SipNetworkProfileBackendHandler.js');
var stringify = require('stringify');


function GetClusterByID(res, Id) {


    dbmodel.Cloud.find({where: [{id: parseInt(Id) }, {Activate: true}]}).complete(function (err, cloudInstance) {

        if (!err) {

            try {
                var instance = JSON.stringify(cloudInstance);

                res.write(instance);
            } catch(exp) {

                res.write("");

            }
        } else {

            res.write("");
        }

        res.end();

    })

}

function CreateCluster(req, res, next) {



    var model = 0;
    var status = 0;
    if(req.body){


        var cloudData=req.body;

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
            Category: cloudData.Category

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


                try {

                    res.write(status.toString());
                    res.end();


                }
                catch(exp){

                    console.log("There is a error in --> CreateCluster ", exp)

                }
            })



    }
    else{

        console.log("obj is null in CreateCluster");
        res.write(status.toString());
        res.end();

    }

    return next();

}

function AddLoadBalancer(res, req) {

    var loadBalancer=req.body;
    var status = 0;
    if(loadBalancer){

        dbmodel.Cloud.find({where: [{ id: loadBalancer.clusterID}, {Activate: true}]}).complete(function(err, cloudObject) {
            if(!err && cloudObject) {
                console.log(cloudObject)


                var loadBalancerObject = dbmodel.LoadBalancer.build(
                    {
                        Type: loadBalancer.Type,
                        MainIP: loadBalancer.MainIP
                    }
                )


                loadBalancerObject
                    .save()
                    .complete(function (err) {

                        if (!err) {


                            cloudObject.setLoadBalancer(loadBalancerObject).complete(function (errx, cloudInstancex) {

                                    status = 1;
                                    res.write(status.toString());
                                    res.end();


                            });


                        } else {

                            res.send(status.toString());
                            res.end();

                            console.log("Error on loadbalancer save --> ", err);

                        }
                    }
                )
            }
            else
            {
                res.send(status.toString());
                res.end();

            }

        })


    }
    else{

        res.send(status.toString());
        res.end();
        console.log("obj is null in AddLoadBalancer");

    }


}

function ActivateCloud(res, id, activate){


    var activeStatus = activate;

    var status = 0;
    var idx = parseInt(id);
    dbmodel.Cloud.find({ ID: idx }).complete(function(err, cloudObject) {
        if(!err && cloudObject) {

            cloudObject.updateAttributes({

                    Activate: activeStatus

                }).complete(function (err) {
                    if (err) {
                        console.log("Cloud model update false ->", err)
                    } else {
                        status = 1;
                        console.log("Cloud model updated ")
                    }


                    try {

                        res.send(status.toString());
                        res.end();

                    }
                    catch (exp) {

                        console.log("There is a error in --> CreateCluster ", exp)

                    }

                })
        }
        else
        {
            res.send(status.toString());
            res.end();

        }
    });

}

function CreateCallServer(req, res, next) {



    var model = 0;
    var status = 0;

    if(req.body){

        var csData=req.body;

        var callserver = dbmodel.CallServer.build({
            Name: csData.Name,
            //ID: DataTypes.INTEGER,
            Activate: csData.Activate,
            Code: csData.Code,
            CompanyId: csData.CompanyId,
            TenantId: csData.TenantId,
            Class: csData.Class,
            Type: csData.Type,
            Category: csData.Category,
            InternalMainIP: csData.InternalIP
        })


        callserver
            .save()
            .complete(function(err) {
                if (!!err) {
                    console.log('The cloud instance has not been saved:', err)
                } else {
                    console.log('Cloud have a persisted instance now')
                    status = 1;
                }


                try {

                    res.write(status.toString());
                    res.end();


                }
                catch(exp){

                    console.log("There is a error in --> CreateCluster ", exp)

                }
            })
    }
    else{

        console.log("obj is null in CreateCluster");
        res.write(status.toString());
        res.end();

    }

    return next();


}

function ActivateCallServer(res, id, activate){


    var activeStatus = activate;

    var idx = parseInt(id);

    var status = 0;
    dbmodel.CallServer.find({ id: idx }).complete(function(err, csObject) {
        if(!err && csObject) {

            csObject.updateAttributes({

                Activate: activeStatus

            }).complete(function (err) {
                if (err) {
                    console.log("Cloud model update false ->", err)
                } else {
                    status = 1;
                    console.log("Cloud model updated ")
                }


                try {

                    res.send(status);
                    res.end();

                }
                catch (exp) {

                    console.log("There is a error in --> CreateCluster ", exp)

                }

            })
        }
        else
        {
            res.send(status);
            res.end();

        }
    });

}

function GetCallServerByID(res, Id) {


    var idx = parseInt(Id);
    dbmodel.CallServer.find({where: [{id: idx}, {Activate: true}]}).complete(function (err, csInstance) {

        if (!err) {

            try {
                var instance = JSON.stringify(csInstance);

                res.write(instance);
            } catch(exp) {

                res.write("");

            }

        } else {

            res.write("");
        }

        res.end();

    })

}

function AddCallServerToCloud(res, Id, cloudID) {


    var status = 0;
    dbmodel.CallServer.find({where: [{id: parseInt(Id)}, {Activate: true}]}).complete(function (err, csInstance) {

        if (!err && csInstance) {

            dbmodel.Cloud.find({where: [{id: parseInt(cloudID)}, {Activate: true}]}).complete(function (err, cloudInstance) {

                if (!err && cloudInstance) {

                    cloudInstance.addCallServer(csInstance).complete(function (errx, cloudInstancex) {

                        status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            res.write(status.toString());
            res.end();
        }

    })

}

function SetParentCloud(res, chilid, parentid) {


    var status = 0;
    dbmodel.Cloud.find({where: [{id: parseInt(chilid)}, {Activate: true}]}).complete(function (err, childInstance) {

        if (!err && childInstance && childInstance.CloudModel > 1) {

            dbmodel.Cloud.find({where: [{id: parseInt(parentid)}, {Activate: true}]}).complete(function (err, parentInstance) {

                if (!err && parentInstance && (childInstance.id != parentInstance.id) && childInstance.CloudModel == 1) {

                    childInstance.setParentCloud(parentInstance).complete(function (errx, cloudInstancex) {

                        status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            res.write(status.toString());
            res.end();
        }

    })

}

function CreateTelcoNetwork(res, req){


    /*

    *  id serial NOT NULL,
     "Type" character varying(255),
     "Owner" integer,
     "Network" character varying(255),
     "Mask" integer,
     "NATIP" character varying(255),
     "createdAt" timestamp with time zone NOT NULL,
     "updatedAt" timestamp with time zone NOT NULL,
     "CSDBClusterId" integer,


     */



    var model = 0;
    var status = 0;
    if(req.body){


        var networkData=req.body;



        var network = dbmodel.Network.build({
            Type: "TELCO",
            Owner: 0,
            Network: networkData.Network,
            Mask: networkData.Mask,
            NATIP: networkData.NATIP,
            CompanyId: networkData.CompanyId,
            TenantId: networkData.TenantId


        })


        network
            .save()
            .complete(function(err) {
                if (!!err) {
                    console.log('The network instance has not been saved:', err)
                } else {
                    console.log('Network has a persisted instance now')
                    status = 1;
                }


                try {

                    res.write(status.toString());
                    res.end();


                }
                catch(exp){

                    console.log("There is a error in --> CreateCluster ", exp)

                }
            })



    }
    else{

        console.log("obj is null in CreateTelcoNetwork");
        res.write(status.toString());
        res.end();

    }


}

function CreateEndUserNetwork(res, req){


    /*

     *  id serial NOT NULL,
     "Type" character varying(255),
     "Owner" integer,
     "Network" character varying(255),
     "Mask" integer,
     "NATIP" character varying(255),
     "createdAt" timestamp with time zone NOT NULL,
     "updatedAt" timestamp with time zone NOT NULL,
     "CSDBClusterId" integer,


     */



    var model = 0;
    var status = 0;
    if(req.body){


        var networkData=req.body;



        var network = dbmodel.Network.build({
            Type: "USER",
            Owner: 0,
            Network: networkData.Network,
            Mask: networkData.Mask,
            NATIP: networkData.NATIP,
            CompanyId: networkData.CompanyId,
            TenantId: networkData.TenantId


        })


        network
            .save()
            .complete(function(err) {
                if (!!err) {
                    console.log('The network instance has not been saved:', err)
                } else {
                    console.log('Network has a persisted instance now')
                    status = 1;
                }


                try {

                    res.write(status.toString());
                    res.end();


                }
                catch(exp){

                    console.log("There is a error in --> CreateCluster ", exp)

                }
            })



    }
    else{

        console.log("obj is null in CreateTelcoNetwork");
        res.write(status.toString());
        res.end();

    }


}

function SetTelcoNetworkToCloud(res, networkId, cloudId){
    var status = 0;
    dbmodel.Network.find({where: [{id:  parseInt(networkId)}]}).complete(function (err, networkInstance) {

        if (!err && networkInstance) {

            dbmodel.Cloud.find({where: [{id: parseInt(cloudId)}, {Activate: true}]}).complete(function (err, cloudInstance) {

                if (!err && cloudInstance) {

                    cloudInstance.addNetwork(networkInstance).complete(function (errx, cloudInstancex) {

                        status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            res.write(status.toString());
            res.end();
        }

    })
}

function SetTelcoNetworkToUSer(res, networkId, userID){
    var status = 0;
    dbmodel.Network.find({where: [{id: parseInt(networkId)}]}).complete(function (err, networkInstance) {

        if (!err && networkInstance) {

            dbmodel.CloudEndUser.find({where: [{id: parseInt(userID)}]}).complete(function (err, userInstance) {

                if (!err && userInstance) {

                    userInstance.setNetworks(networkInstance).complete(function (errx, cloudInstancex) {

                        if(!errx)
                            status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            res.write(status.toString());
            res.end();
        }

    })
}

function CreateEndUser(res,req)
{

    /*

     CompanyId: DataTypes.INTEGER,
     TenantId: DataTypes.INTEGER,
     Domain: DataTypes.STRING,
     SIPConnectivityProvision: DataTypes.INTEGER //instance, profile, sheared
     */
    var provision = 0;
    var status = 0;
    if(req.body){


        var userData=req.body;

        dbmodel.Cloud.find({where: [{ id: userData.clusterID}, {Activate: true}]}).complete(function(err, cloudObject) {
            if(!err && cloudObject) {
                console.log(cloudObject)

                if (0 < userData.Provision && userData.Provision < 4) {

                    console.log("provision is correct ");
                    model = provision.Provision;

                }
                else {

                    console.log("provision is incorrect trying sheared");

                }

                var user = dbmodel.CloudEndUser.build({
                    Domain: userData.Domain,
                    CompanyId: userData.CompanyId,
                    TenantId: userData.TenantId,
                    SIPConnectivityProvision: provision

                })


                user
                    .save()
                    .complete(function (err) {
                        if (err) {
                            console.log('The user instance has not been saved:', err);
                        } else {
                            console.log('user have a persisted instance now');
                            status = 1;


                            cloudObject.addCloudEndUser(user).complete(function (errx, cloudInstancex) {

                                if(!errx)
                                    status = 1;

                            });

                        }


                        try {

                            res.write(status.toString());
                            res.end();


                        }
                        catch (exp) {

                            console.log("There is a error in --> CreateEndUser ", exp);

                        }
                    })

            }
            else{

                console.log("obj is null in CreateEndUser");
                res.write(status.toString());
                res.end();

            }
        })



    }
    else{

        console.log("obj is null in CreateEndUser");
        res.write(status.toString());
        res.end();

    }


}


function CreateSipProfile(res, req){


    var status = 0;

    if(req.body) {


        var userData = req.body;
        profileHandler.addSipNetworkProfile(userData,function(err, id, sta){

            if(err){

                console.log("obj is null in CreateEndUser");
                res.write(status.toString());
                res.end();

            }else{

                status = 1;
                console.log("obj is null in CreateEndUser");
                res.write(status.toString());
                res.end();

            }

        });
    }
    else
    {
        console.log("obj is null in CreateEndUser");
        res.write(status.toString());
        res.end();

    }



}

function AssignSipProfileToCallServer(res, profileid, callserverID){


    var status = 0;


        profileHandler.addNetworkProfileToCallServer(profileid,callserverID,function(err, id, sta){

            if(err){

                console.log("obj is null in CreateEndUser");
                res.write(status.toString());
                res.end();

            }else{

                status = 1;
                console.log("obj is null in CreateEndUser");
                res.write(status.toString());
                res.end();

            }

        });


};

module.exports.CreateCluster = CreateCluster;
module.exports.AddLoadBalancer = AddLoadBalancer;
module.exports.GetClusterByID = GetClusterByID;
module.exports.ActivateCloud = ActivateCloud;
module.exports.CreateCallServer = CreateCallServer;
module.exports.ActivateCallServer = ActivateCallServer;
module.exports.GetCallServerByID = GetCallServerByID;
module.exports.AddCallServerToCloud = AddCallServerToCloud;
module.exports.SetParentCloud = SetParentCloud;
module.exports.CreateTelcoNetwork = CreateTelcoNetwork;
module.exports.SetTelcoNetworkToCloud = SetTelcoNetworkToCloud;
module.exports.CreateEndUserNetwork = CreateEndUserNetwork;
module.exports.SetTelcoNetworkToUSer = SetTelcoNetworkToUSer;
module.exports.CreateEndUser = CreateEndUser;
module.exports.CreateSipProfile = CreateSipProfile;
module.exports.AssignSipProfileToCallServer = AssignSipProfileToCallServer;