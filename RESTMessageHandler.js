var dbmodel = require('./DVP-DBModels');
var profileHandler = require('./DVP-Common/SipNetworkProfileApi/SipNetworkProfileBackendHandler.js');
var stringify = require('stringify');
var config = require('config');
var redis = require('redis');




var redisip =config.Redis.ip;
var redisport =config.Redis.port ;

var redisClient = redis.createClient(redisport,redisip);

redisClient.on('error',function(err){
    console.log('Error ' + err);
});


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

function StoreIPAddressDetails(res, req) {

    var IPAddress = req.body;
    var status = 0;


    if (IPAddress) {

        var idx = parseInt(IPAddress.CallserverID);
        dbmodel.CallServer.find({where: [{id: idx}, {Activate: true}]}).complete(function (err, csInstance) {
            try {

                if (!err && csInstance) {

                    var IP = dbmodel.IPAddress.build(
                        {
                            MainIP: IPAddress.MainIP,
                            IP: IPAddress.IP,
                            IsAllocated: IPAddress.IsAllocated
                        }
                    );


                    IP.save()
                        .complete(function (err) {

                            if (!err) {
                                try {
                                    IP.setCallServer(csInstance).complete(function (errx) {


                                        try {
                                            if (!errx) {
                                                status = 1;
                                                res.write(status.toString());
                                                res.end();
                                            }
                                            else {

                                                console.log("Set network to callserver failed fatal error");
                                                res.write("");
                                                res.end();


                                            }
                                        }
                                        catch(exxy) {

                                        }

                                    });
                                } catch (exxxx) {
                                    console.log("Set network to callserver failed fatal error");
                                    res.write("");
                                    res.end();


                                }
                            }
                            else {

                                console.log("error in IP save");
                                res.write("");
                                res.end();
                            }
                        });

                } else {

                    console.log("no callserver found");
                    res.write("");
                    res.end();
                }

            } catch (ex) {

                console.log(ex);
                res.write("");
                res.end();


            }


        })


    } else {

        console.log("Object is invalid");
        res.write("");
        res.end();

    }


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
    dbmodel.CallServer.find({where: [{ id: idx }]}).complete(function(err, csObject) {
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

                    userInstance.setNetwork(networkInstance).complete(function (errx, cloudInstancex) {

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

function CreateEndUser(res,req) {
    var provision = 0;
    var status = 0;
    if(req.body){


        var userData=req.body;

        dbmodel.Cloud.find({where: [{ id: userData.clusterID}, {Activate: true}]}).complete(function(err, cloudObject) {
            if(!err && cloudObject) {
                console.log(cloudObject)

                if (0 < userData.Provision && userData.Provision < 4) {

                    console.log("provision is correct ");
                    provision = provision.Provision;

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

function GetProfileByID(res, id){

    dbmodel.SipNetworkProfile.find({where: [{id: parseInt(id)}]}).complete(function (err, profile) {

        if (!err) {

            try {
                var instance = JSON.stringify(profile);

                res.write(instance);
            } catch(exp) {

                res.write("");

            }
        } else {

            res.write("");
        }

        res.end();
    });
}

function AssignSipProfileToCallServer(res, profileid, callserverID){


    var status = 0;

    dbmodel.CallServer.find({where: [{id: callserverID}, {Activate: true}]}).complete(function (err, csInstance) {

        if (!err && csInstance) {


           // csInstance.getIPAddress();


            try {
                //var instance = JSON.stringify(csInstance);

               // res.write(instance);

                profileHandler.addNetworkProfileToCallServer(profileid,callserverID,function(err, id, sta){

                    if(err){

                        console.log("obj is null in CreateEndUser");
                        res.write(status.toString());
                        res.end();

                    }else{

                        status = 1;
                        console.log("Successfully bind with callserver - ");
                        redisClient.publish("CSCOMMAND:"+csInstance.Code+":profile", profileid, redis.print);
                        res.write(status.toString());
                        res.end();

                    }

                });

            } catch(exp) {

                res.write("");

            }

        } else {

            res.write("");
        }

        res.end();

    })






};

function AssignSipProfiletoEndUser(res, profileid, enduserID){


    var status = 0;

    dbmodel.CloudEndUser.find({where: [{id: enduserID}]}).complete(function (err, enduser) {

        if (!err && enduser) {





            try {
                //var instance = JSON.stringify(csInstance);

                // res.write(instance);

                profileHandler.addNetworkProfiletoEndUser(profileid,enduserID,function(err, id, sta){

                    if(err){

                        console.log("obj is null in CreateEndUser");
                        res.write(status.toString());
                        res.end();

                    }else{

                        status = 1;
                        console.log("Successfully bind with EndUser - ");
                        //redisClient.publish("CSCOMMAND:"+csInstance.Name+":profile", JSON.stringify(id), redis.print);
                        res.write(status.toString());
                        res.end();

                    }

                });

            } catch(exp) {

                res.write("");

            }

        } else {

            res.write("");
        }

        res.end();

    })

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
module.exports.AssignSipProfiletoEndUser = AssignSipProfiletoEndUser;
module.exports.StoreIPAddressDetails = StoreIPAddressDetails;
module.exports.GetProfileByID = GetProfileByID;