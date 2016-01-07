var dbmodel = require('dvp-dbmodels');
var profileHandler = require('dvp-common/SipNetworkProfileApi/SipNetworkProfileBackendHandler.js');
var stringify = require('stringify');
var config = require('config');
var redis = require('redis');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var msg = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


var redisip =config.Redis.ip;
var redisport =config.Redis.port ;

var redisClient = redis.createClient(redisport,redisip);

redisClient.on('error',function(err){
    console.log('Error ' + err);
});

function GetClusterByID(res, Id) {

    logger.debug("DVP-ClusterConfiguration.GetClusterByID HTTP id %s", Id);


    dbmodel.Cloud.find({where: [{id: parseInt(Id) }, {Activate: true}], include: [{ model: dbmodel.LoadBalancer, as: "LoadBalancer"}]}).then(function (cloudInstance) {


            try {

                var instance = msg.FormatMessage(undefined,"Cluster found", true,cloudInstance);

                logger.debug("DVP-ClusterConfiguration.GetClusterByID PGSQL id %s found", Id);



                res.write(instance);
            } catch(exp) {

                logger.error("DVP-ClusterConfiguration.GetClusterByID stringify json failed", Id, exp);
                //res.write("");

            }


            res.end();

    }).catch(function (err){


            logger.error("DVP-ClusterConfiguration.GetClusterByID PGSQL %s failed", Id, err);
            res.write(msg.FormatMessage(err,"Cluster NotFound", false,undefined));

            res.end();


    });

}

function GetClusters(req, res){


    logger.debug("DVP-ClusterConfiguration.GetClusters HTTP");


    dbmodel.Cloud.findAll({where: [{Activate: true}],include: [{ model: dbmodel.LoadBalancer, as: "LoadBalancer"}]}).then(function (cloudInstance) {




            try {



                var instance = msg.FormatMessage(undefined,"Cluster Found", true,cloudInstance);

                logger.debug("DVP-ClusterConfiguration.GetClusters PGSQL  found");
                res.write(instance);
            } catch(exp) {

                logger.error("DVP-ClusterConfiguration.GetClusters stringify json failed",  exp);


                res.write("");

            }





        res.end();

    }).catch( function(err){


        logger.error("DVP-ClusterConfiguration.GetClusters PGSQL failed",  err);
        res.write(msg.FormatMessage(err,"Cluster NotFound", false,undefined));

    });



}

function EditCluster(Id, req, res, next){


    logger.debug("DVP-ClusterConfiguration.EditCluster HTTP");

    dbmodel.Cloud.find({where: [{id: parseInt(Id) }, {Activate: true}]}).then(function (cloudInstance) {


        try {


            logger.debug("DVP-ClusterConfiguration.EditCluster PGSQL id %s found", Id);




            var status = false;
            var returnerror= undefined;

            if(req.body && cloudInstance){
                var model = cloudInstance.CloudModel;


                var cloudData=req.body;

                if(0<cloudData.CloudModel && cloudData.CloudModel<4) {

                    logger.debug("DVP-ClusterConfiguration.CreateCluster model validated");
                    model = cloudData.CloudModel;

                }
                else{

                    logger.debug("DVP-ClusterConfiguration.CreateCluster model validate failed go with private");

                }


                cloudInstance.updateAttributes({

                        Name: cloudData.Name,
                        CloudModel: model,
                        Class: cloudData.Class,
                        Type: cloudData.Type,
                        Category: cloudData.Category

                    }).then(function(inst) {




                        logger.debug('DVP-ClusterConfiguration.EditCluster PGSQL Cloud object updated successful');
                        status = true;

                        try {


                            var instance = msg.FormatMessage(returnerror,"Cluster updating", status,undefined);
                            res.write(instance);
                            res.end();


                        }
                        catch(exp){

                            logger.error('DVP-ClusterConfiguration.EditCluster Update failed ', exp);

                        }
                    }).catch(function (err){


                        logger.error("DVP-ClusterConfiguration.EditCluster PGSQL Update failed ",err);
                        returnerror = err;
                        var instance = msg.FormatMessage(returnerror,"Cluster Update", status,undefined);
                        res.write(instance);
                        res.end();


                    })

            }
            else{

                logger.error("DVP-ClusterConfiguration.EditCluster request.body is null");

                var instance = msg.FormatMessage(undefined,"Cluster Update", false,undefined);
                res.write(instance);
                res.end();

            }


        } catch(exp) {

            logger.error("DVP-ClusterConfiguration.EditCluster stringify json failed", Id, exp);
            res.end();

        }


        //res.end();

    }).catch(function (err){


        logger.error("DVP-ClusterConfiguration.EditCluster PGSQL %s failed", Id, err);
        res.write(msg.FormatMessage(err,"Cluster NotFound", false,undefined));

        res.end();


    });




}

function CreateCluster(req, res, next) {



    logger.debug("DVP-ClusterConfiguration.CreateCluster HTTP");

    var model = 0;
    var status = false;
    var returnerror= undefined;

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
            Category: cloudData.Category,
            Activate: true

        })


        cloud
            .save()
            .then(function(inst) {




                logger.debug('DVP-ClusterConfiguration.CreateCluster PGSQL Cloud object saved successful');
                status = true;

                try {


                    var instance = msg.FormatMessage(returnerror,"Cluster creation", status,inst);
                    res.write(instance);
                    res.end();


                }
                catch(exp){

                    logger.error('DVP-ClusterConfiguration.CreateCluster Service failed ', exp);

                }
            }).catch(function (err){


                logger.error("DVP-ClusterConfiguration.CreateCluster PGSQL save failed ",err);
                returnerror = err;
                var instance = msg.FormatMessage(returnerror,"Cluster creation", status,undefined);
                res.write(instance);
                res.end();


            })



    }
    else{

        logger.error("DVP-ClusterConfiguration.CreateCluster request.body is null");

        var instance = msg.FormatMessage(undefined,"Cluster creation", false,undefined);
        res.write(instance);
        res.end();

    }

    return next();

}

function StoreIPAddressDetails(res, req) {

    var IPAddress = req.body;
    var status = false;


    logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails HTTP");

    if (IPAddress) {

        logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails Model validated ", IPAddress);

        var idx = parseInt(IPAddress.CallserverID);
        dbmodel.CallServer.find({where: [{id: idx}, {Activate: true}]}).then(function (csInstance) {
            try {

                if ( csInstance) {

                    var IP = dbmodel.IPAddress.build(
                        {
                            MainIp: IPAddress.MainIP,
                            IP: IPAddress.IP,
                            IsAllocated: IPAddress.IsAllocated
                        }
                    );

                    logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer Found");



                    IP.save()
                        .then(function (inst) {

                                logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Saved");

                                try {
                                    IP.setCallServer(csInstance).then(function (inst) {


                                        try {


                                                logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Successful");
                                                status = true;
                                                var instance = msg.FormatMessage(undefined,"Store IPAddress", status,undefined);
                                                res.write(instance);
                                                res.end();



                                        }
                                        catch(exxy) {

                                            logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed",exxy);

                                        }

                                    }).catch(function (err){


                                        logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed",err);

                                        var instance = msg.FormatMessage(err,"Store IPAddress", status,undefined);
                                        res.write(instance);
                                        res.end();


                                    });
                                } catch (exxxx) {

                                    logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed",exxxx);
                                    var instance = msg.FormatMessage(exxxx,"Store IPAddress", status,undefined);
                                    res.write(instance);
                                    res.end();


                                }


                        }).catch(function (err){


                            logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Saved Failed",err);
                            var instance = msg.FormatMessage(err,"Store IPAddress", status,undefined);
                            res.write(instance);
                            res.end();


                        });

                } else {

                    logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound");
                    var instance = msg.FormatMessage(undefined,"Store IPAddress", status,undefined);
                    res.write(instance);
                    res.end();
                }

            } catch (ex) {

                logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound", ex);
                var instance = msg.FormatMessage(undefined,"Store IPAddress", status,undefined);
                res.write(instance);
                res.end();


            }


        }).then(function (err){

            logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound", err);
            var instance = msg.FormatMessage(undefined,"Store IPAddress", status,undefined);
            res.write(instance);
            res.end();


        });


    } else {

        logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails Object Validation Failed");
        var instance = msg.FormatMessage(undefined,"Store IPAddress", status,undefined);
        res.write(instance);
        res.end();

    }


}

function AddLoadBalancer(res, req) {

    logger.debug("DVP-ClusterConfiguration.AddLoadBalancer HTTP");

    var loadBalancer=req.body;
    var status = false;
    if(loadBalancer){

        dbmodel.Cloud.find({where: [{ id: loadBalancer.clusterID}, {Activate: true}]}).then(function(cloudObject) {
            if(cloudObject) {
                logger.debug("DVP-ClusterConfiguration.AddLoadBalancer Cloud Found ");

                var loadBalancerObject = dbmodel.LoadBalancer.build(
                    {
                        Type: loadBalancer.Type,
                        MainIP: loadBalancer.MainIP
                    }
                )


                loadBalancerObject
                    .save()
                    .then(function (instance) {


                            logger.debug("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Saved ");

                            cloudObject.setLoadBalancer(loadBalancerObject).then(function (cloudInstancex) {

                                logger.debug("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Set Cloud");

                                status = true;

                                var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
                                res.write(instance);
                                res.end();


                            }).catch(function (err){

                                logger.debug("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Set Cloud failed");

                                status = false;

                                var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
                                res.write(instance);
                                res.end();

                            });

                    }).catch(function (err){

                        var instance = msg.FormatMessage(err, "Add LoadBalancer", status, undefined);
                        res.write(instance);

                        logger.error("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Save Failed ",err);

                    });
            }
            else
            {
                logger.error("DVP-ClusterConfiguration.AddLoadBalancer Cloud NotFound ");
                var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
                res.write(instance);
                res.end();

            }

        }).catch(function (err){

            logger.error("DVP-ClusterConfiguration.AddLoadBalancer Cloud NotFound ");
            var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
            res.write(instance);
            res.end();

        });


    }
    else{

        var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
        res.write(instance);
        res.end();
        logger.debug("DVP-ClusterConfiguration.AddLoadBalancer Object Validation Failed ");

    }


}

function ActivateCloud(res, id, activate){


    logger.debug("DVP-ClusterConfiguration.ActivateCloud HTTP %s", id);

    var activeStatus = (activate === 'true');

    var status = false;
    var idx = parseInt(id);
    var outerror = undefined;
    dbmodel.Cloud.find({where:{ id: idx }}).then(function(cloudObject) {
        if(cloudObject) {

            logger.debug("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Found");


            cloudObject.updateAttributes({

                    Activate: activeStatus

                }).then(function (instance) {


                status = true;
                logger.error("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Activate Successful");


                    try {

                        var instance = msg.FormatMessage(outerror, "Activate cloud", status, undefined);
                        res.write(instance);
                        res.end();

                    }
                    catch (exp) {

                        logger.error("DVP-ClusterConfiguration.ActivateCloud Cloud Activate Failed", exp);

                    }

                }).catch(function (err){

                if(err){

                    logger.error("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Activation Failed", err);
                    outerror = err;

                    var instance = msg.FormatMessage(outerror, "Activate cloud", status, undefined);
                    res.write(instance);
                    res.end();


                }
            })
        }
        else
        {
            logger.error("DVP-ClusterConfiguration.ActivateCloud Cloud NotFound");
            var instance = msg.FormatMessage(err, "Activate cloud", status, undefined);
            res.write(instance);
            res.end();

        }
    }).catch(function (err){

        logger.error("DVP-ClusterConfiguration.ActivateCloud Cloud NotFound", err);
        var instance = msg.FormatMessage(err, "Activate cloud", status, undefined);
        res.write(instance);
        res.end();

    });

}

function CreateCallServer(req, res, next) {



    logger.debug("DVP-ClusterConfiguration.CreateCallServer HTTP");

    var model = 0;
    var status = false;
    var outerror = undefined;

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
            .then(function(instance) {

                    logger.debug('DVP-ClusterConfiguration.CreateCluster PGSQL CallServer object saved successful');
                    status = true;



                try {

                    var instance = msg.FormatMessage(outerror, "Create callserver", status, undefined);
                    res.write(instance);
                    res.end();


                }
                catch(exp){

                    console.log("There is a error in --> CreateCluster ", exp)

                }
            }).catch(function (err){

                logger.error("DVP-ClusterConfiguration.CreateCallServer PGSQL CallServer Save Failed ", err);
                var instance = msg.FormatMessage(err, "Create callserver", status, undefined);
                res.write(instance);
                res.end();

            });
    }
    else{

        logger.error("DVP-ClusterConfiguration.CreateCallServer Object Validation Failed");
        var instance = msg.FormatMessage(undefined, "Create callserver", status, undefined);
        res.write(instance);
        res.end();

    }

    return next();


}

function ActivateCallServer(res, id, activate){


    var activeStatus = (activate === 'true');

    var idx = parseInt(id);
    var outerror = undefined;

    logger.debug("DVP-ClusterConfiguration.ActivateCallServer HTTP %s ", id);

    var status = false;
    dbmodel.CallServer.find({where: [{ id: idx }]}).then(function( csObject) {
        if(csObject) {

            logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer Found");

            csObject.updateAttributes({

                Activate: activeStatus

            }).then(function (instance) {

                status = true;
                logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer Activated");


                try {

                    var instance = msg.FormatMessage(outerror, "Activate callserver", status, undefined);
                    res.write(instance);
                    res.end();

                }
                catch (exp) {

                    logger.debug("DVP-ClusterConfiguration.ActivateCallServer CallServer Activate Error ", exp);

                }

            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer Activation Failed ", err);
                outerror = err;
                var instance = msg.FormatMessage(outerror, "Activate callserver", status, undefined);
                res.write(instance);
                res.end();
            });
        }


        else
        {
            logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer NotFound ", err);
            var instance = msg.FormatMessage(undefined, "Activate callserver", status, undefined);
            res.write(instance);
            res.end();

        }
    }).catch(function (err){

        logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer NotFound ", err);
        var instance = msg.FormatMessage(undefined, "Activate callserver", status, undefined);
        res.write(instance);
        res.end();

    });

}

function GetCallServerByID(res, Id) {


    logger.debug("DVP-ClusterConfiguration.GetCallServerByID HTTP id %s ", Id);

    var idx = parseInt(Id);
    dbmodel.CallServer.find({where: [{id: idx}, {Activate: true}]}).then(function (csInstance) {


            try {
                var instance = msg.FormatMessage(undefined, "Get callserver by ID", true, csInstance);
                res.write(instance);

                logger.debug("DVP-ClusterConfiguration.GetCallServerByID id %d Found", Id);


            } catch(exp) {



            }

        res.end();

    }).catch(function (err){

        logger.error("DVP-ClusterConfiguration.GetCallServerByID id %d Failed", Id, err);

        var instance = msg.FormatMessage(err, "Get callserver by ID", false, undefined);
        res.write(instance);

        res.end();

    });

}

function GetCallServers(req, res) {


    logger.debug("DVP-ClusterConfiguration.GetCallServers HTTP  ");


    dbmodel.CallServer.findAll({where: [{Activate: true}]}).then(function (csInstance) {


            try {


                logger.debug("DVP-ClusterConfiguration.GetCallServers Found");

                var instance = msg.FormatMessage(undefined, "Get callservers", true, csInstance);
                res.write(instance);

            } catch(exp) {



            }

        res.end();

    }).catch(function (err){


        logger.error("DVP-ClusterConfiguration.GetCallServers Failed", err);

        var instance = msg.FormatMessage(err, "Get callservers", false, csInstance);
        res.write(instance);


    });

}

function AddCallServerToCloud(res, Id, cloudID) {


    logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud id HTTP %s to %s", Id, cloudID);
    var status = false;
    dbmodel.CallServer.find({where: [{id: parseInt(Id)}, {Activate: true}]}).then(function (csInstance) {

        if ( csInstance) {

            logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL CallServer %s Found", Id);


            dbmodel.Cloud.find({where: [{id: parseInt(cloudID)}, {Activate: true}]}).then(function (cloudInstance) {

                if (cloudInstance) {

                    logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL Cloud %s Found", cloudID);

                    cloudInstance.addCallServer(csInstance).then(function (cloudInstancex) {

                        logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL");

                        status = true;
                        var instance = msg.FormatMessage(undefined, "AddCallservers to cloud", status, undefined);
                        res.write(instance);
                        res.end();

                    }).catch(function(err){

                        status = false;
                        var instance = msg.FormatMessage(err, "AddCallservers to cloud", status, undefined);
                        res.write(instance);
                        res.end();


                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL Cloud %s NotFound", cloudID);

                    var instance = msg.FormatMessage(undefined, "AddCallservers to cloud", status, undefined);
                    res.write(instance);

                    res.end();
                }


            }).catch(function (err){

                logger.error("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL Cloud %s NotFound", cloudID, err);

                var instance = msg.FormatMessage(undefined, "AddCallservers to cloud", status, undefined);
                res.write(instance);

                res.end();

            });

        } else {

            logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL CallServer %s NotFound", Id);

            var instance = msg.FormatMessage(undefined, "AddCallservers to cloud", status, undefined);
            res.write(instance);
            res.end();
        }

    }).catch(function (err){

        logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL CallServer %s NotFound", Id, err);

        var instance = msg.FormatMessage(undefined, "AddCallservers to cloud", status, undefined);
        res.write(instance);
        res.end();
    });

}

function SetParentCloud(res, chilid, parentid) {



    logger.debug("DVP-ClusterConfiguration.SetParentCloud HTTP id %s to %s", chilid, parentid);

    var status = false;
    dbmodel.Cloud.find({where: [{id: parseInt(chilid)}, {Activate: true}]}).then(function ( childInstance) {

        if ( childInstance && childInstance.CloudModel > 1) {


            logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL ChildCloud %s Found", chilid);

            dbmodel.Cloud.find({where: [{id: parseInt(parentid)}, {Activate: true}]}).then(function ( parentInstance) {

                if ( parentInstance && (childInstance.id != parentInstance.id) && childInstance.CloudModel == 1) {

                    logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL ParentCloud %s Found", parentid);


                    childInstance.setParentCloud(parentInstance).then(function ( cloudInstancex) {

                        logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL");


                        status = true;
                        var instance = msg.FormatMessage(undefined, "Set ParentCloud", status, undefined);
                        res.write(instance);
                        res.end();

                    }).catch(function (err){

                        status = false;
                        var instance = msg.FormatMessage(err, "Set ParentCloud", status, undefined);
                        res.write(instance);
                        res.end();



                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.SetParentCloud PGSQL ParentCloud %s NotFound", parentid);

                    var instance = msg.FormatMessage(err, "Set ParentCloud No Parent", status, undefined);
                    res.write(instance);
                    res.end();
                }


            }).catch(function (err){


                logger.error("DVP-ClusterConfiguration.SetParentCloud PGSQL ParentCloud %s NotFound", parentid, err);

                var instance = msg.FormatMessage(err, "Set ParentCloud No Parent", status, undefined);
                res.write(instance);
                res.end();

            });

        } else {

            logger.error("DVP-ClusterConfiguration.SetParentCloud PGSQL ChildCloud %s NotFound", chilid);

            var instance = msg.FormatMessage(err, "Set ParentCloud No Cloud", status, undefined);
            res.write(instance);

            res.end();
        }

    }).catch(function (err){

        logger.error("DVP-ClusterConfiguration.SetParentCloud PGSQL ChildCloud %s NotFound", chilid, err);

        var instance = msg.FormatMessage(err, "Set ParentCloud No Cloud", status, undefined);
        res.write(instance);

        res.end();



    });

}

function GetNetworks(req, res){

    logger.debug("DVP-ClusterConfiguration.GetNetworks HTTP");

    dbmodel.Network.findAll().then(function (network) {



            logger.debug("DVP-ClusterConfiguration.GetNetworks PGSQL Network Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get Networks", true, network);
                res.write(instance);


            } catch(exp) {



            }


        res.end();
    }).catch(function (err){

        logger.debug("DVP-ClusterConfiguration.GetNetworks PGSQL Network NotFound",  err);


        var instance = msg.FormatMessage(err, "Get Networks", false, undefined);
        res.write(instance);

        res.end();

    });

}

function GetNetworkByClusterID(req, res, Id) {

    logger.debug("DVP-ClusterConfiguration.GetNetworkByClusterID HTTP id %d", Id);


    dbmodel.Cloud.find({where: [{id: parseInt(Id) }, {Activate: true}], include: [{ model: dbmodel.Network, as: "Network"}]}).then(function (cloudInstance) {




            try {


                logger.debug("DVP-ClusterConfiguration.GetNetworkByClusterID PGSQL id %s found", Id);

                var instance = msg.FormatMessage(undefined, "Get Network by ClusterID", true, cloudInstance.Network);
                res.write(instance);

            } catch(exp) {

                logger.error("DVP-ClusterConfiguration.GetNetworkByClusterID stringify json id %s failed", Id, exp);
                //res.write("");

            }


        res.end();

    }).catch(function (err){

        var instance = msg.FormatMessage(err, "Get Network by ClusterID", false, undefined);
        res.write(instance);


        res.end();

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


    logger.debug("DVP-ClusterConfiguration.CreateTelcoNetwork HTTP");


    var model = 0;
    var status = false;
    var outerror = undefined;
    if(req.body){

        logger.debug("DVP-ClusterConfiguration.CreateTelcoNetwork Object Validated", req.body);



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
            .then(function(instance) {



                    logger.debug('DVP-ClusterConfiguration.CreateTelcoNetwork PGSQL TelcoNetwork object saved successful');
                    status = true;



                try {

                    var instance = msg.FormatMessage(err, "Create Telco Network", status, undefined);
                    res.write(instance);
                    res.end();


                }
                catch(exp){

                    console.log("There is a error in --> CreateCluster ", exp)

                }
            }).catch(function (err){


                logger.error("DVP-ClusterConfiguration.CreateTelcoNetwork PGSQL TelcoNetwork Save Failed ", err);

                var instance = msg.FormatMessage(err, "Create Telco Network", status, undefined);
                res.write(instance);
                res.end();


            });



    }
    else{

        logger.error("DVP-ClusterConfiguration.CreateTelcoNetwork Object Validation Failed");
        var instance = msg.FormatMessage(undefined, "Create Telco Network", status, undefined);
        res.write(instance);
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


    logger.debug("DVP-ClusterConfiguration.CreateEndUserNetwork HTTP");


    var model = 0;
    var status = false;
    if(req.body){

        logger.debug("DVP-ClusterConfiguration.CreateEndUserNetwork Object Validated", req.body);



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
            .then(function(instance) {


                    logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL UserNetwork object saved successful');
                    status = true;


                try {

                    var instance = msg.FormatMessage(err, "Create User Network", status, undefined);
                    res.write(instance);
                    res.end();


                }
                catch(exp){

                    console.log("There is a error in --> CreateCluster ", exp)

                }
            }).catch(function (err){

                logger.error("DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL UserNetwork Save Failed ", err);
                var instance = msg.FormatMessage(err, "Create User Network", status, undefined);
                res.write(instance);
                res.end();


            });



    }
    else{

        logger.error("DVP-ClusterConfiguration.CreateEndUserNetwork Object Validation Failed");
        var instance = msg.FormatMessage(undefined, "Create User Network", status, undefined);
        res.write(instance);
        res.end();

    }


}

function SetTelcoNetworkToCloud(res, networkId, cloudId){
    var status = false;

    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud HTTP id %s to %s", networkId, cloudId);

    dbmodel.Network.find({where: [{id:  parseInt(networkId)}]}).then(function (networkInstance) {

        if (networkInstance) {

            logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Network %s Found", networkId);

            dbmodel.Cloud.find({where: [{id: parseInt(cloudId)}, {Activate: true}]}).then(function (cloudInstance) {

                if ( cloudInstance) {


                    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Cloud %s Found", cloudId);

                    cloudInstance.addNetwork(networkInstance).then(function (cloudInstancex) {


                        logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL");

                        status = true;
                        var instance = msg.FormatMessage(undefined, "Set Telco Network cloud", status, undefined);
                        res.write(instance);
                        res.end();

                    }).catch (function (err){

                        status = false;
                        var instance = msg.FormatMessage(err, "Set Telco Network cloud", status, undefined);
                        res.write(instance);
                        res.end();

                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Cloud %s NotFound ", cloudId);
                    var instance = msg.FormatMessage(err, "Set Telco Network cloud NotFound", status, undefined);
                    res.write(instance);
                    res.end();
                }


            }).catch(function (err){

                logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Cloud %s NotFound ", cloudId, err);
                var instance = msg.FormatMessage(err, "Set Telco Network cloud NotFound", status, undefined);
                res.write(instance);
                res.end();

            });

        } else {

            logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Network %s NotFound ", networkId);

            var instance = msg.FormatMessage(err, "Set Telco Network NotFound", status, undefined);
            res.write(instance);
            res.end();
        }

    }).catch(function (err){

        logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Network %s NotFound ", networkId, err);

        var instance = msg.FormatMessage(err, "Set Telco Network NotFound", status, undefined);
        res.write(instance);
        res.end();

    });
}

function SetTelcoNetworkToUSer(res, networkId, userID){
    var status = false;

    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer HTTP id %s to %s", networkId, userID);

    dbmodel.Network.find({where: [{id: parseInt(networkId)}]}).then(function ( networkInstance) {

        if ( networkInstance) {

            logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL Network %s Found", networkId);

            dbmodel.CloudEndUser.find({where: [{id: parseInt(userID)}]}).then(function ( userInstance) {

                if ( userInstance) {

                    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL CloudEndUser %s Found", userID);

                    userInstance.setNetwork(networkInstance).then(function ( cloudInstancex) {


                        logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL");

                        if(!errx)
                            status = true;
                        var instance = msg.FormatMessage(undefined, "Set Telco Network To User", status, undefined);
                        res.write(instance);
                        res.end();

                    }).catch(function (err){

                        status =false;
                        var instance = msg.FormatMessage(err, "Set Telco Network To User", status, undefined);
                        res.write(instance);
                        res.end();


                    });

                } else {

                    logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL CloudEndUser %s NotFound", userID);

                    var instance = msg.FormatMessage(err, "Set Telco Network To User NotFound", status, undefined);
                    res.write(instance);
                    res.end();
                }


            }).catch(function (err){

                logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL CloudEndUser %s NotFound", userID, err);

                var instance = msg.FormatMessage(err, "Set Telco Network To User NotFound", status, undefined);
                res.write(instance);
                res.end();


            });

        } else {

            logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL Network %s NotFound", networkId);

            var instance = msg.FormatMessage(err, "Set Telco Network To Network NotFound", status, undefined);
            res.write(instance);
            res.end();
        }

    }).catch(function (err){

        logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL Network %s NotFound", networkId, err);

        var instance = msg.FormatMessage(err, "Set Telco Network To Network NotFound", status, undefined);
        res.write(instance);
        res.end();


    });
}

function CreateEndUser(res,req) {


    logger.debug("DVP-ClusterConfiguration.CreateEndUser HTTP");

    var provision = 0;
    var status = false;
    if(req.body){


        logger.debug("DVP-ClusterConfiguration.CreateEndUser Object Validated", req.body);


        var userData=req.body;

        dbmodel.Cloud.find({where: [{ id: userData.ClusterID}, {Activate: true}]}).then(function( cloudObject) {
            if( cloudObject) {


                logger.debug("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d Found", userData.ClusterID);

                console.log(cloudObject)

                if (0 < userData.Provision && userData.Provision < 4) {

                    logger.debug("DVP-ClusterConfiguration.CreateEndUser CloudEnduser Provision data correct");
                    provision = userData.Provision;

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
                    .then(function (instance) {



                            logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser object saved successful');
                            status = true;


                            cloudObject.addCloudEndUser(user).then(function (cloudInstancex) {

                                logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser added to Cloud ');


                                if(!errx)
                                    status = true;

                            }).catch(function (err){

                                status = false;
                                var instance = msg.FormatMessage(err, "Create EndUser", status, undefined);
                                res.write(instance);
                                res.end();

                            });




                        try {

                            var instance = msg.FormatMessage(undefined, "Create EndUser Done", status, undefined);
                            res.write(instance);
                            res.end();


                        }
                        catch (exp) {

                            console.log("There is a error in --> CreateEndUser ", exp);

                        }
                    }).catch(function (err){

                        logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL CloudEnduser Save Failed ", err);
                        status = false;
                        var instance = msg.FormatMessage(err, "Create EndUser", status, undefined);
                        res.write(instance);
                        res.end();

                    });

            }
            else{

                logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID);
                var instance = msg.FormatMessage(err, "Create EndUser failed", status, undefined);
                res.write(instance);
                res.end();

            }
        }).catch(function (err){

            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID, err);
            var instance = msg.FormatMessage(err, "Create EndUser failed", status, undefined);
            res.write(instance);
            res.end();

            });



    }
    else{

        logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Object Validation failed");
        var instance = msg.FormatMessage(undefined, "Create EndUser failed", status, undefined);
        res.write(instance);
        res.end();

    }


}

function GetEndUsers(req, res){


    logger.debug("DVP-ClusterConfiguration.EndUsers HTTP");

    dbmodel.CloudEndUser.findAll().then(function ( enduser) {


            logger.debug("DVP-ClusterConfiguration.EndUser PGSQL EndUsers Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get EndUser", true, enduser);
                res.write(instance);
                res.end();
            } catch(exp) {



            }


    }).catch(function (err){


        logger.debug("DVP-ClusterConfiguration.EndUsers PGSQL EndUser NotFound",  err);
        var instance = msg.FormatMessage(err, "Get EndUser failed", false, undefined);
        res.write(instance);
        res.end();

    });
}

function GetEndUsersByClusterID(req, res, Id) {

    logger.debug("DVP-ClusterConfiguration.GetEndUsersByClusterID HTTP id %d", Id);


    dbmodel.Cloud.find({where: [{id: parseInt(Id) }, {Activate: true}], include: [{ model: dbmodel.CloudEndUser, as: "CloudEndUser"}]}).then(function ( cloudInstance) {




            var instanceout;

            try {


                logger.debug("DVP-ClusterConfiguration.GetEndUsersByClusterID PGSQL id %s found", Id);
                instanceout = msg.FormatMessage(undefined, "Get EndUser by CloudID", true, cloudInstance.CloudEndUser);



            } catch(exp) {

                logger.error("DVP-ClusterConfiguration.GetEndUsersByClusterID stringify json %s failed", Id, exp);
                instanceout = msg.FormatMessage(exp, "Get EndUser by CloudID failed", false, undefined);


            }

            res.write(instanceout);
            res.end();







    }).catch(function (err){


        var instanceout = msg.FormatMessage(err, "Get EndUser by CloudID failed", false, undefined);
        res.write(instanceout);
        res.end();

    });

}

function CreateSipProfile(res, req){


    logger.debug("DVP-ClusterConfiguration.CreateSipProfile HTTP");


    var status = false;

    if(req.body) {


        logger.error("DVP-ClusterConfiguration.CreateSipProfile Object Validated");



        var userData = req.body;
        profileHandler.addSipNetworkProfile(userData,function(err, id, sta){

            if(err){

                logger.error("DVP-ClusterConfiguration.CreateSipProfile PGSQL SipProfile object save Failed");
                var instance = msg.FormatMessage(err, "Create SipProfile failed", status, undefined);
                res.write(instance);
                res.end();

            }else{

                status = true;
                logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL SipProfile object saved successful');
                var instance = msg.FormatMessage(undefined, "Create SipProfile done", status, undefined);
                res.write(instance);
                res.end();

            }

        });
    }
    else
    {
        logger.error("DVP-ClusterConfiguration.CreateSipProfile Object Validation failed");
        var instance = msg.FormatMessage(undefined, "Create SipProfile done", status, undefined);
        res.write(instance);
        res.end();

    }



}

function GetProfileByID(res, id){


    logger.debug("DVP-ClusterConfiguration.GetProfileByID HTTP");

    dbmodel.SipNetworkProfile.find({where: [{id: parseInt(id)}]}).then(function ( profile) {




            logger.debug("DVP-ClusterConfiguration.GetProfileByID PGSQL SipProfile %s Found", id);


            try {
                var instance = msg.FormatMessage(undefined, "Get Profile ByID", true, profile);
                res.write(instance);
                res.end();
            } catch(exp) {

                //res.write("");

            }






    }).catch(function (err){


        logger.debug("DVP-ClusterConfiguration.GetProfileByID PGSQL SipProfile %s NotFound", id, err);


        var instance = msg.FormatMessage(err, "Get Profile ByID failed", false, undefined);
        res.write(instance);
        res.end();

    });
}

function GetProfiles(req, res){


    logger.debug("DVP-ClusterConfiguration.GetProfiles HTTP");

    dbmodel.SipNetworkProfile.findAll().then(function (profile) {




            logger.debug("DVP-ClusterConfiguration.GetProfiles PGSQL SipProfile Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get Profiles", true, profile);
                res.write(instance);
                res.end();
            } catch(exp) {

                //res.write("");

            }






    }).catch(function(err){


        logger.debug("DVP-ClusterConfiguration.GetProfiles PGSQL SipProfile NotFound",  err);


        var instance = msg.FormatMessage(err, "Get Profiles failed", true, undefined);
        res.write(instance);
        res.end();

    });
}

function AssignSipProfileToCallServer(res, profileid, callserverID){


    var status = false;

    logger.debug("DVP-ClusterConfiguration.AssignSipProfileToCallServer HTTP");

    dbmodel.CallServer.find({where: [{id: callserverID}, {Activate: true}]}).complete(function (csInstance) {

        if ( csInstance) {


           // csInstance.getIPAddress();


            try {
                //var instance = JSON.stringify(csInstance);

               // res.write(instance);

                profileHandler.addNetworkProfileToCallServer(profileid,callserverID,function(err, id, sta){

                    if(err){

                        logger.error("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d failed", profileid, callserverID, err );
                        var instance = msg.FormatMessage(err, "Assign SipProfile To CallServer", status, undefined);
                        res.write(instance);
                        res.end();

                    }else{

                        status = true;
                        logger.debug("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d ", profileid, callserverID );
                        redisClient.publish("CSCOMMAND:"+csInstance.Code+":profile", profileid, redis.print);
                        var instance = msg.FormatMessage(undefined, "Assign SipProfile To CallServer", status, undefined);
                        res.write(instance);
                        res.end();

                    }

                });

            } catch(exp) {

                var instance = msg.FormatMessage(undefined, "Assign SipProfile To CallServer", status, undefined);
                res.write(instance);
                res.end();

            }

        } else {

            var instance = msg.FormatMessage(err, "Assign SipProfile To CallServer", status, undefined);
            res.write(instance);
            res.end();
        }



    }).catch(function (err){

        var instance = msg.FormatMessage(err, "Assign SipProfile To CallServer", status, undefined);
        res.write(instance);
        res.end();



    });






};

function AssignSipProfiletoEndUser(res, profileid, enduserID){



    logger.debug("DVP-ClusterConfiguration.AssignSipProfiletoEndUser HTTP");

    var status = false;

    dbmodel.CloudEndUser.find({where: [{id: enduserID}]}).then(function ( enduser) {

        if (enduser) {


            try {
                //var instance = JSON.stringify(csInstance);

                // res.write(instance);

                profileHandler.addNetworkProfiletoEndUser(profileid,enduserID,function(err, id, sta){

                    if(err){

                        logger.error("DVP-ClusterConfiguration.AssignSipProfiletoEndUser PGSQL SipProfile %d to EndUser %d ", profileid, enduserID );
                        var instance = msg.FormatMessage(err, "Assign SipProfile to EndUser", status, undefined);
                        res.write(instance);
                        res.end();

                    }else{

                        status = true;
                        logger.error("DVP-ClusterConfiguration.AssignSipProfiletoEndUser PGSQL SipProfile %d to EndUser %d failed", profileid, enduserID, err );
                        //redisClient.publish("CSCOMMAND:"+csInstance.Name+":profile", JSON.stringify(id), redis.print);
                        var instance = msg.FormatMessage(err, "Assign SipProfile to EndUser", status, undefined);
                        res.write(instance);
                        res.end();

                    }

                });

            } catch(exp) {

                var instance = msg.FormatMessage(exp, "Assign SipProfile to EndUser", status, undefined);
                res.write(instance);
                res.end();

            }

        } else {

            var instance = msg.FormatMessage(err, "Assign SipProfile to EndUser", status, undefined);
            res.write(instance);
            res.end();
        }



    }).catch(function (err){

        var instance = msg.FormatMessage(err, "Assign SipProfile to EndUser", status, undefined);
        res.write(instance);
        res.end();

    });

};

module.exports.CreateCluster = CreateCluster;
module.exports.AddLoadBalancer = AddLoadBalancer;
module.exports.GetClusterByID = GetClusterByID;
module.exports.GetClusters = GetClusters;
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
module.exports.GetNetworks = GetNetworks;
module.exports.CreateEndUser = CreateEndUser;
module.exports.GetEndUsers = GetEndUsers;
module.exports.CreateSipProfile = CreateSipProfile;
module.exports.AssignSipProfileToCallServer = AssignSipProfileToCallServer;
module.exports.AssignSipProfiletoEndUser = AssignSipProfiletoEndUser;
module.exports.StoreIPAddressDetails = StoreIPAddressDetails;
module.exports.GetProfileByID = GetProfileByID;
module.exports.GetCallServers = GetCallServers;
module.exports.GetProfiles = GetProfiles;
module.exports.GetNetworkByClusterID =GetNetworkByClusterID;
module.exports.GetEndUsersByClusterID = GetEndUsersByClusterID;
module.exports.EditCluster = EditCluster;