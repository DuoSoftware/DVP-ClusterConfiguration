var dbmodel = require('DVP-DBModels');
var profileHandler = require('DVP-Common/SipNetworkProfileApi/SipNetworkProfileBackendHandler.js');
var stringify = require('stringify');
var config = require('config');
var redis = require('redis');
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;




var redisip =config.Redis.ip;
var redisport =config.Redis.port ;

var redisClient = redis.createClient(redisport,redisip);

redisClient.on('error',function(err){
    console.log('Error ' + err);
});


function GetClusterByID(res, Id) {

    logger.debug("DVP-ClusterConfiguration.GetClusterByID id %d", Id);


    dbmodel.Cloud.find({where: [{id: parseInt(Id) }, {Activate: true}]}).complete(function (err, cloudInstance) {


        if (!err) {

            try {
                var instance = JSON.stringify(cloudInstance);

                logger.debug("DVP-ClusterConfiguration.GetClusterByID PGSQL id %d found %j", Id, cloudInstance);

                res.write(instance);
            } catch(exp) {

                logger.error("DVP-ClusterConfiguration.GetClusterByID PGSQL id %d failed", Id, exp);
                res.write("");

            }
        } else {


            logger.error("DVP-ClusterConfiguration.GetClusterByID Server %d failed", Id, err);
            res.write("");
        }

        res.end();

    })

}

function CreateCluster(req, res, next) {



    logger.debug("DVP-ClusterConfiguration.CreateCluster method called");

    var model = 0;
    var status = 0;
    if(req.body){


        var cloudData=req.body;

        if(0<cloudData.CloudModel && cloudData.CloudModel<4) {

            logger.debug("DVP-ClusterConfiguration.CreateCluster model validated");
            model = cloudData.CloudModel;

        }
        else{

            logger.debug("DVP-ClusterConfiguration.CreateCluster model validate failed go with private");

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
                    logger.error("DVP-ClusterConfiguration.CreateCluster PGSQL save failed ",err);
                } else {
                    logger.debug('DVP-ClusterConfiguration.CreateCluster PGSQL Cloud object saved successful %j', model);
                    status = 1;
                }


                try {

                    res.write(status.toString());
                    res.end();


                }
                catch(exp){

                    logger.error('DVP-ClusterConfiguration.CreateCluster Service failed ', exp);

                }
            })



    }
    else{

        logger.error("DVP-ClusterConfiguration.CreateCluster request.body is null");
        res.write(status.toString());
        res.end();

    }

    return next();

}

function StoreIPAddressDetails(res, req) {

    var IPAddress = req.body;
    var status = 0;


    logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails ");

    if (IPAddress) {

        logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails Model validated %j", IPAddress);

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

                    logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer Found %j", csInstance);



                    IP.save()
                        .complete(function (err) {

                            if (!err) {


                                logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Saved %j", IP);

                                try {
                                    IP.setCallServer(csInstance).complete(function (errx) {


                                        try {
                                            if (!errx) {

                                                logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Successful");
                                                status = 1;
                                                res.write(status.toString());
                                                res.end();
                                            }
                                            else {


                                                logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed",errx);
                                                res.write("");
                                                res.end();


                                            }
                                        }
                                        catch(exxy) {

                                            logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed",exxy);

                                        }

                                    });
                                } catch (exxxx) {

                                    logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed",exxxx);
                                    res.write("");
                                    res.end();


                                }
                            }
                            else {

                                logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Saved Failed",exxxx);
                                res.write("");
                                res.end();
                            }
                        });

                } else {

                    logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound");
                    res.write("");
                    res.end();
                }

            } catch (ex) {

                logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound", ex);
                res.write("");
                res.end();


            }


        })


    } else {

        logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails Object Validation Failed");
        res.write("");
        res.end();

    }


}

function AddLoadBalancer(res, req) {

    logger.debug("DVP-ClusterConfiguration.AddLoadBalancer");

    var loadBalancer=req.body;
    var status = 0;
    if(loadBalancer){

        dbmodel.Cloud.find({where: [{ id: loadBalancer.clusterID}, {Activate: true}]}).complete(function(err, cloudObject) {
            if(!err && cloudObject) {
                logger.debug("DVP-ClusterConfiguration.AddLoadBalancer Cloud Found %j ",cloudObject);

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


                            logger.debug("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Saved ",loadBalancerObject);

                            cloudObject.setLoadBalancer(loadBalancerObject).complete(function (errx, cloudInstancex) {

                                logger.debug("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Set Cloud");

                                    status = 1;
                                    res.write(status.toString());
                                    res.end();


                            });


                        } else {

                            res.send(status.toString());
                            res.end();

                            logger.error("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Save Failed ",err);

                        }
                    }
                )
            }
            else
            {
                logger.error("DVP-ClusterConfiguration.AddLoadBalancer Cloud NotFound ");
                res.send(status.toString());
                res.end();

            }

        })


    }
    else{

        res.send(status.toString());
        res.end();
        logger.debug("DVP-ClusterConfiguration.AddLoadBalancer Object Validation Failed ");

    }


}

function ActivateCloud(res, id, activate){


    logger.debug("DVP-ClusterConfiguration.ActivateCloud %s", id);

    var activeStatus = activate;

    var status = 0;
    var idx = parseInt(id);
    dbmodel.Cloud.find({ ID: idx }).complete(function(err, cloudObject) {
        if(!err && cloudObject) {

            logger.debug("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Found %j", cloudObject);


            cloudObject.updateAttributes({

                    Activate: activeStatus

                }).complete(function (err) {
                    if (err) {
                        logger.error("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Activation Failed", err);
                    } else {
                        status = 1;
                        logger.error("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Activate Successful");
                    }


                    try {

                        res.send(status.toString());
                        res.end();

                    }
                    catch (exp) {

                        logger.error("DVP-ClusterConfiguration.ActivateCloud Cloud Activate Failed", exp);

                    }

                })
        }
        else
        {
            logger.error("DVP-ClusterConfiguration.ActivateCloud Cloud NotFound", err);
            res.send(status.toString());
            res.end();

        }
    });

}

function CreateCallServer(req, res, next) {



    logger.debug("DVP-ClusterConfiguration.CreateCallServer");

    var model = 0;
    var status = 0;

    if(req.body){

        logger.debug("DVP-ClusterConfiguration.CreateCallServer Object Validated");

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
                    logger.error("DVP-ClusterConfiguration.CreateCallServer PGSQL CallServer Save Failed ", err);

                } else {
                    logger.debug('DVP-ClusterConfiguration.CreateCluster PGSQL CallServer object saved successful %j', callserver);
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

        logger.error("DVP-ClusterConfiguration.CreateCallServer Object Validation Failed");
        res.write(status.toString());
        res.end();

    }

    return next();


}

function ActivateCallServer(res, id, activate){


    var activeStatus = activate;

    var idx = parseInt(id);

    logger.debug("DVP-ClusterConfiguration.ActivateCallServer %s", id);

    var status = 0;
    dbmodel.CallServer.find({where: [{ id: idx }]}).complete(function(err, csObject) {
        if(!err && csObject) {

            logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer Found %j", csObject);

            csObject.updateAttributes({

                Activate: activeStatus

            }).complete(function (err) {
                if (err) {
                    logger.error("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer Activation Failed ", err);
                } else {
                    status = 1;
                    logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer Activated");
                }


                try {

                    res.send(status);
                    res.end();

                }
                catch (exp) {

                    logger.debug("DVP-ClusterConfiguration.ActivateCallServer CallServer Activate Error ", exp);

                }

            })
        }
        else
        {
            logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer NotFound ", err);
            res.send(status);
            res.end();

        }
    });

}

function GetCallServerByID(res, Id) {


    logger.debug("DVP-ClusterConfiguration.GetCallServerByID id %d", Id);

    var idx = parseInt(Id);
    dbmodel.CallServer.find({where: [{id: idx}, {Activate: true}]}).complete(function (err, csInstance) {

        if (!err) {



            try {
                var instance = JSON.stringify(csInstance);

                logger.debug("DVP-ClusterConfiguration.GetCallServerByID id %d Found %s", Id, instance);

                res.write(instance);
            } catch(exp) {

                res.write("");

            }

        } else {

            logger.error("DVP-ClusterConfiguration.GetCallServerByID id %d Failed", Id, err);

            res.write("");
        }

        res.end();

    })

}

function AddCallServerToCloud(res, Id, cloudID) {


    logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud id %s to %s", Id, cloudID);
    var status = 0;
    dbmodel.CallServer.find({where: [{id: parseInt(Id)}, {Activate: true}]}).complete(function (err, csInstance) {

        if (!err && csInstance) {

            logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL CallServer %s Found %j", Id, csInstance);


            dbmodel.Cloud.find({where: [{id: parseInt(cloudID)}, {Activate: true}]}).complete(function (err, cloudInstance) {

                if (!err && cloudInstance) {

                    logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL Cloud %s Found %j", cloudID, cloudInstance);

                    cloudInstance.addCallServer(csInstance).complete(function (errx, cloudInstancex) {

                        logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL");

                        status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL Cloud %s NotFound", cloudID, err);

                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL CallServer %s NotFound %j", Id, err);

            res.write(status.toString());
            res.end();
        }

    })

}

function SetParentCloud(res, chilid, parentid) {



    logger.debug("DVP-ClusterConfiguration.SetParentCloud id %s to %s", chilid, parentid);

    var status = 0;
    dbmodel.Cloud.find({where: [{id: parseInt(chilid)}, {Activate: true}]}).complete(function (err, childInstance) {

        if (!err && childInstance && childInstance.CloudModel > 1) {


            logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL ChildCloud %s Found %j", chilid, childInstance);

            dbmodel.Cloud.find({where: [{id: parseInt(parentid)}, {Activate: true}]}).complete(function (err, parentInstance) {

                if (!err && parentInstance && (childInstance.id != parentInstance.id) && childInstance.CloudModel == 1) {

                    logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL ParentCloud %s Found %j", parentid, parentInstance);


                    childInstance.setParentCloud(parentInstance).complete(function (errx, cloudInstancex) {

                        logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL");


                        status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.SetParentCloud PGSQL ParentCloud %s NotFound", parentid, err);

                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            logger.error("DVP-ClusterConfiguration.SetParentCloud PGSQL ChildCloud %s NotFound", chilid, err);

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


    logger.debug("DVP-ClusterConfiguration.CreateTelcoNetwork");


    var model = 0;
    var status = 0;
    if(req.body){

        logger.debug("DVP-ClusterConfiguration.CreateTelcoNetwork Object Validated %j", req.body);



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
                    logger.error("DVP-ClusterConfiguration.CreateTelcoNetwork PGSQL TelcoNetwork Save Failed ", err);
                } else {
                    logger.debug('DVP-ClusterConfiguration.CreateTelcoNetwork PGSQL TelcoNetwork object saved successful %j', network);
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

        logger.error("DVP-ClusterConfiguration.CreateTelcoNetwork Object Validation Failed");
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


    logger.debug("DVP-ClusterConfiguration.CreateEndUserNetwork");


    var model = 0;
    var status = 0;
    if(req.body){

        logger.debug("DVP-ClusterConfiguration.CreateEndUserNetwork Object Validated %j", req.body);



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
                    logger.error("DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL UserNetwork Save Failed ", err);
                } else {
                    logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL UserNetwork object saved successful %j', network);
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

        logger.error("DVP-ClusterConfiguration.CreateEndUserNetwork Object Validation Failed");
        res.write(status.toString());
        res.end();

    }


}

function SetTelcoNetworkToCloud(res, networkId, cloudId){
    var status = 0;

    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud id %s to %s", networkId, cloudId);

    dbmodel.Network.find({where: [{id:  parseInt(networkId)}]}).complete(function (err, networkInstance) {

        if (!err && networkInstance) {

            logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Network %s Found %j", networkId, networkInstance);

            dbmodel.Cloud.find({where: [{id: parseInt(cloudId)}, {Activate: true}]}).complete(function (err, cloudInstance) {

                if (!err && cloudInstance) {


                    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Cloud %s Found %j", cloudId, cloudInstance);

                    cloudInstance.addNetwork(networkInstance).complete(function (errx, cloudInstancex) {


                        logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL");

                        status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Cloud %s NotFound ", cloudId, err);
                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Network %s NotFound ", networkId, err);

            res.write(status.toString());
            res.end();
        }

    })
}

function SetTelcoNetworkToUSer(res, networkId, userID){
    var status = 0;

    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer id %s to %s", networkId, userID);

    dbmodel.Network.find({where: [{id: parseInt(networkId)}]}).complete(function (err, networkInstance) {

        if (!err && networkInstance) {

            logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL Network %s Found %j", networkId, networkInstance);

            dbmodel.CloudEndUser.find({where: [{id: parseInt(userID)}]}).complete(function (err, userInstance) {

                if (!err && userInstance) {

                    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL CloudEndUser %s Found %j", userID, userInstance);

                    userInstance.setNetwork(networkInstance).complete(function (errx, cloudInstancex) {


                        logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL");

                        if(!errx)
                            status = 1;
                        res.write(status.toString());
                        res.end();

                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL CloudEndUser %s NotFound %j", userID, err);

                    res.write(status.toString());
                    res.end();
                }


            })

        } else {

            logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL Network %s NotFound", networkId, err);

            res.write(status.toString());
            res.end();
        }

    })
}

function CreateEndUser(res,req) {


    logger.debug("DVP-ClusterConfiguration.CreateEndUser");

    var provision = 0;
    var status = 0;
    if(req.body){


        logger.debug("DVP-ClusterConfiguration.CreateEndUser Object Validated %j", req.body);


        var userData=req.body;

        dbmodel.Cloud.find({where: [{ id: userData.clusterID}, {Activate: true}]}).complete(function(err, cloudObject) {
            if(!err && cloudObject) {


                logger.debug("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d Found %j", userData.clusterID, cloudObject);

                console.log(cloudObject)

                if (0 < userData.Provision && userData.Provision < 4) {

                    logger.debug("DVP-ClusterConfiguration.CreateEndUser CloudEnduser Provision data correct");
                    provision = provision.Provision;

                }
                else {

                    logger.debug("DVP-ClusterConfiguration.CreateEndUser CloudEnduser Provision data incorrect proceed with sheared");

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
                            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL CloudEnduser Save Failed ", err);
                        } else {
                            logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser object saved successful %j', user);
                            status = 1;


                            cloudObject.addCloudEndUser(user).complete(function (errx, cloudInstancex) {

                                logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser added to Cloud ');


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

                logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID, err);
                res.write(status.toString());
                res.end();

            }
        })



    }
    else{

        logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Object Validation failed");
        res.write(status.toString());
        res.end();

    }


}

function CreateSipProfile(res, req){


    logger.debug("DVP-ClusterConfiguration.CreateSipProfile");


    var status = 0;

    if(req.body) {


        logger.error("DVP-ClusterConfiguration.CreateSipProfile Object Validated");



        var userData = req.body;
        profileHandler.addSipNetworkProfile(userData,function(err, id, sta){

            if(err){

                logger.error("DVP-ClusterConfiguration.CreateSipProfile PGSQL SipProfile object save Failed");
                res.write(status.toString());
                res.end();

            }else{

                status = 1;
                logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL SipProfile object saved successful %j', userData);
                res.write(status.toString());
                res.end();

            }

        });
    }
    else
    {
        logger.error("DVP-ClusterConfiguration.CreateSipProfile Object Validation failed");
        res.write(status.toString());
        res.end();

    }



}

function GetProfileByID(res, id){


    logger.debug("DVP-ClusterConfiguration.GetProfileByID");

    dbmodel.SipNetworkProfile.find({where: [{id: parseInt(id)}]}).complete(function (err, profile) {

        if (!err) {


            logger.debug("DVP-ClusterConfiguration.GetProfileByID PGSQL SipProfile %d Found %j", id, profile);


            try {
                var instance = JSON.stringify(profile);

                res.write(instance);
            } catch(exp) {

                res.write("");

            }
        } else {

            logger.debug("DVP-ClusterConfiguration.GetProfileByID PGSQL SipProfile %d NotFound", id, err);


            res.write("");
        }

        res.end();
    });
}

function AssignSipProfileToCallServer(res, profileid, callserverID){


    var status = 0;

    logger.debug("DVP-ClusterConfiguration.AssignSipProfileToCallServer");

    dbmodel.CallServer.find({where: [{id: callserverID}, {Activate: true}]}).complete(function (err, csInstance) {

        if (!err && csInstance) {


           // csInstance.getIPAddress();


            try {
                //var instance = JSON.stringify(csInstance);

               // res.write(instance);

                profileHandler.addNetworkProfileToCallServer(profileid,callserverID,function(err, id, sta){

                    if(err){

                        logger.error("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d failed", profileid, callserverID, err );
                        res.write(status.toString());
                        res.end();

                    }else{

                        status = 1;
                        logger.debug("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d ", profileid, callserverID );
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



    logger.debug("DVP-ClusterConfiguration.AssignSipProfiletoEndUser");

    var status = 0;

    dbmodel.CloudEndUser.find({where: [{id: enduserID}]}).complete(function (err, enduser) {

        if (!err && enduser) {





            try {
                //var instance = JSON.stringify(csInstance);

                // res.write(instance);

                profileHandler.addNetworkProfiletoEndUser(profileid,enduserID,function(err, id, sta){

                    if(err){

                        logger.error("DVP-ClusterConfiguration.AssignSipProfiletoEndUser PGSQL SipProfile %d to EndUser %d ", profileid, enduserID );
                        res.write(status.toString());
                        res.end();

                    }else{

                        status = 1;
                        logger.error("DVP-ClusterConfiguration.AssignSipProfiletoEndUser PGSQL SipProfile %d to EndUser %d failed", profileid, enduserID, err );
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