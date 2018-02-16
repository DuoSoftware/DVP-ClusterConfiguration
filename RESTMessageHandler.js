var dbmodel = require('dvp-dbmodels');
var config = require('config');
var redis = require('redis');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var msg = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var auditTrailHandler = require('dvp-common/AuditTrail/AuditTrailsHandler.js');
//var jwt = require('restify-jwt');
var validator = require('validator');
var redisCacheHandler = require('dvp-common/CSConfigRedisCaching/RedisHandler.js');
var redisClient = require('./RedisHandler.js').redisClient;



function GetClusterByID(req, res, Id) {


    logger.debug("DVP-ClusterConfiguration.GetClusterByID HTTP id %s", Id);

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;




        dbmodel.Cloud.find({
            where: [{id: parseInt(Id)}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}],
            include: [{model: dbmodel.LoadBalancer, as: "LoadBalancer"}, {
                model: dbmodel.CallServer,
                as: "CallServer"
            }, {model: dbmodel.Network, as: "Network"}]
        }).then(function (cloudInstance) {


            try {

                var instance = msg.FormatMessage(undefined, "Cluster found", true, cloudInstance);

                logger.debug("DVP-ClusterConfiguration.GetClusterByID PGSQL id %s found", Id);


                res.write(instance);
            } catch (exp) {

                logger.error("DVP-ClusterConfiguration.GetClusterByID stringify json failed", Id, exp);
                //res.write("");

            }


            res.end();

        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.GetClusterByID PGSQL %s failed", Id, err);
            res.write(msg.FormatMessage(err, "Cluster NotFound", false, undefined));

            res.end();


        });
    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function GetClusters(req, res) {


    logger.debug("DVP-ClusterConfiguration.GetClusters HTTP");



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.Cloud.findAll({
            where: [{Activate: true},{CompanyId: company}, {TenantId: tenant}],
            include: [{model: dbmodel.LoadBalancer, as: "LoadBalancer"}, {
                model: dbmodel.CallServer,
                as: "CallServer"
            }, {model: dbmodel.Network, as: "Network"}]
        }).then(function (cloudInstance) {


            try {


                var instance = msg.FormatMessage(undefined, "Cluster Found", true, cloudInstance);

                logger.debug("DVP-ClusterConfiguration.GetClusters PGSQL  found");
                res.write(instance);
            } catch (exp) {

                logger.error("DVP-ClusterConfiguration.GetClusters stringify json failed", exp);


                res.write("");

            }


            res.end();

        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.GetClusters PGSQL failed", err);
            res.write(msg.FormatMessage(err, "Cluster NotFound", false, undefined));

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function GetActiveCallserversByClusterID(req, res) {


    logger.debug("DVP-ClusterConfiguration.GetClusters HTTP");

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.Cloud.findAll({
            where: [{Activate: true},{CompanyId: company}, {TenantId: tenant}],
            include: [{model: dbmodel.LoadBalancer, as: "LoadBalancer"}, {
                model: dbmodel.CallServer,
                as: "CallServer",
                where: [{Activate: true}]
            }, {model: dbmodel.Network, as: "Network"}]
        }).then(function (cloudInstance) {


            try {


                var instance = msg.FormatMessage(undefined, "Cluster Found", true, cloudInstance);

                logger.debug("DVP-ClusterConfiguration.GetClusters PGSQL  found");
                res.write(instance);
            } catch (exp) {

                logger.error("DVP-ClusterConfiguration.GetClusters stringify json failed", exp);


                res.write("");

            }
            res.end();

        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.GetClusters PGSQL failed", err);
            res.write(msg.FormatMessage(err, "Cluster NotFound", false, undefined));

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function EditCluster(Id, req, res) {


    logger.debug("DVP-ClusterConfiguration.EditCluster HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.Cloud.find({where: [{id: parseInt(Id)}, {Activate: true},{CompanyId: company}, {TenantId: tenant}]}).then(function (cloudInstance) {


            try {


                logger.debug("DVP-ClusterConfiguration.EditCluster PGSQL id %s found", Id);


                var status = false;
                var returnerror = undefined;

                if (req.body && cloudInstance) {
                    var model = cloudInstance.CloudModel;


                    var cloudData = req.body;

                    if (0 < cloudData.CloudModel && cloudData.CloudModel < 4) {

                        logger.debug("DVP-ClusterConfiguration.CreateCluster model validated");
                        model = cloudData.CloudModel;

                    }
                    else {

                        logger.debug("DVP-ClusterConfiguration.CreateCluster model validate failed go with private");

                    }


                    cloudInstance.updateAttributes({

                        Name: cloudData.Name,
                        CloudModel: model,
                        Class: cloudData.Class,
                        Type: cloudData.Type,
                        Category: cloudData.Category

                    }).then(function (inst)
                    {
                        if(inst)
                        {
                            redisCacheHandler.addClusterToCache(inst.id);
                        }


                        logger.debug('DVP-ClusterConfiguration.EditCluster PGSQL Cloud object updated successful');
                        status = true;

                        try {


                            var instance = msg.FormatMessage(returnerror, "Cluster updating", status, undefined);
                            res.write(instance);
                            res.end();


                        }
                        catch (exp) {

                            logger.error('DVP-ClusterConfiguration.EditCluster Update failed ', exp);

                        }
                    }).catch(function (err) {


                        logger.error("DVP-ClusterConfiguration.EditCluster PGSQL Update failed ", err);
                        returnerror = err;
                        var instance = msg.FormatMessage(returnerror, "Cluster Update", status, undefined);
                        res.write(instance);
                        res.end();


                    })

                }
                else {

                    logger.error("DVP-ClusterConfiguration.EditCluster request.body is null");

                    var instance = msg.FormatMessage(undefined, "Cluster Update", false, undefined);
                    res.write(instance);
                    res.end();

                }


            } catch (exp) {

                logger.error("DVP-ClusterConfiguration.EditCluster stringify json failed", Id, exp);
                res.end();

            }


            //res.end();

        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.EditCluster PGSQL %s failed", Id, err);
            res.write(msg.FormatMessage(err, "Cluster NotFound", false, undefined));

            res.end();


        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function CreateCluster(req, res) {


    logger.debug("DVP-ClusterConfiguration.CreateCluster HTTP");

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        var model = 0;
        var status = false;
        var returnerror = undefined;

        if (req.body) {


            var cloudData = req.body;

            if (0 < cloudData.CloudModel && cloudData.CloudModel < 4) {

                logger.debug("DVP-ClusterConfiguration.CreateCluster model validated");
                model = cloudData.CloudModel;

            }
            else {

                logger.debug("DVP-ClusterConfiguration.CreateCluster model validate failed go with private");

            }

            var cloud = dbmodel.Cloud.build({
                Name: cloudData.Name,
                CompanyId: company,
                TenantId: tenant,
                CloudModel: model,
                Class: cloudData.Class,
                Type: cloudData.Type,
                Category: cloudData.Category,
                Activate: true

            })


            cloud
                .save()
                .then(function (inst) {

                    if(inst)
                    {
                        redisCacheHandler.addClusterToCache(inst.id);
                    }


                    logger.debug('DVP-ClusterConfiguration.CreateCluster PGSQL Cloud object saved successful');
                    status = true;

                    try {


                        var instance = msg.FormatMessage(returnerror, "Cluster creation", status, inst);
                        res.write(instance);
                        res.end();


                    }
                    catch (exp) {

                        logger.error('DVP-ClusterConfiguration.CreateCluster Service failed ', exp);

                    }
                }).catch(function (err) {


                    logger.error("DVP-ClusterConfiguration.CreateCluster PGSQL save failed ", err);
                    returnerror = err;
                    var instance = msg.FormatMessage(returnerror, "Cluster creation", status, undefined);
                    res.write(instance);
                    res.end();


                })


        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateCluster request.body is null");

            var instance = msg.FormatMessage(undefined, "Cluster creation", false, undefined);
            res.write(instance);
            res.end();

        }




    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function StoreIPAddressDetails(res, req) {

    var IPAddress = req.body;
    var status = false;


    logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        if (IPAddress && IPAddress.IP && validator.isIP(IPAddress.IP)) {

            logger.debug("DVP-ClusterConfiguration.StoreIPAddressDetails Model validated ", IPAddress);

            var idx = parseInt(IPAddress.CallserverID);
            dbmodel.CallServer.find({where: [{id: idx}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (csInstance) {
                try {

                    if (csInstance) {

                        var IP = dbmodel.IPAddress.build(
                            {
                                //MainIp: IPAddress.MainIP,
                                IP: IPAddress.IP,
                                IsAllocated: IPAddress.IsAllocated,
                                CompanyId: company,
                                TenantId: tenant
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
                                            var instance = msg.FormatMessage(undefined, "Store IPAddress", status, undefined);
                                            res.write(instance);
                                            res.end();


                                        }
                                        catch (exxy) {

                                            logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed", exxy);

                                        }

                                    }).catch(function (err) {


                                        logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed", err);

                                        var instance = msg.FormatMessage(err, "Store IPAddress", status, undefined);
                                        res.write(instance);
                                        res.end();


                                    });
                                } catch (exxxx) {

                                    logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Set to Callserver Failed", exxxx);
                                    var instance = msg.FormatMessage(exxxx, "Store IPAddress", status, undefined);
                                    res.write(instance);
                                    res.end();


                                }


                            }).catch(function (err) {


                                logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL IPAddresed Saved Failed", err);
                                var instance = msg.FormatMessage(err, "Store IPAddress", status, undefined);
                                res.write(instance);
                                res.end();


                            });

                    } else {

                        logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound");
                        var instance = msg.FormatMessage(undefined, "Store IPAddress", status, undefined);
                        res.write(instance);
                        res.end();
                    }

                } catch (ex) {

                    logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound", ex);
                    var instance = msg.FormatMessage(undefined, "Store IPAddress", status, undefined);
                    res.write(instance);
                    res.end();


                }


            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails PGSQL CallServer NotFound", err);
                var instance = msg.FormatMessage(undefined, "Store IPAddress", status, undefined);
                res.write(instance);
                res.end();


            });


        } else {

            logger.error("DVP-ClusterConfiguration.StoreIPAddressDetails Object Validation Failed");
            var instance = msg.FormatMessage(undefined, "Store IPAddress", status, undefined);
            res.write(instance);
            res.end();

        }








    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function DeleteIPAddresses(ipId, res, req) {


    logger.error("DVP-ClusterConfiguration.DeleteIPAddresses");

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.IPAddress.find({where: [{id: ipId},{CompanyId: company}, {TenantId: tenant}]}).then(function (ipAddresses) {


            if (ipAddresses) {
                ipAddresses.destroy().then(function (obj) {

                    var instance = msg.FormatMessage(undefined, "Delete IPAddress succeed", true, obj);
                    res.write(instance);
                    res.end();


                }).catch(function (err) {

                    logger.error("DVP-ClusterConfiguration.DeleteIPAddresses error");
                    var instance = msg.FormatMessage(err, "IPAddress found", false, undefined);
                    res.write(instance);
                    res.end();

                });
            } else {

                logger.error("DVP-ClusterConfiguration.DeleteIPAddresses Not found");
                var instance = msg.FormatMessage(undefined, "IPAddress found", false, undefined);
                res.write(instance);
                res.end();

            }


        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.GetIPAddresses No IPs found");
            var instance = msg.FormatMessage(err, "Update SipProfile failed, no IPs found", false, undefined);
            res.write(instance);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function AddLoadBalancer(res, req) {

    logger.debug("DVP-ClusterConfiguration.AddLoadBalancer HTTP");

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        var loadBalancer = req.body;
        var status = false;
        if (loadBalancer) {

            dbmodel.Cloud.find({where: [{id: loadBalancer.ClusterID}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (cloudObject) {
                if (cloudObject) {
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

                                if(cloudObject)
                                {
                                    redisCacheHandler.addClusterToCache(cloudObject.id);
                                }

                                logger.debug("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Set Cloud");

                                status = true;

                                var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
                                res.write(instance);
                                res.end();


                            }).catch(function (err) {

                                logger.error("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Set Cloud failed");

                                status = false;

                                var instance = msg.FormatMessage(err, "Add LoadBalancer", status, undefined);
                                res.write(instance);
                                res.end();

                            });

                        }).catch(function (err) {

                            var instance = msg.FormatMessage(err, "Add LoadBalancer", status, undefined);
                            res.write(instance);

                            logger.error("DVP-ClusterConfiguration.AddLoadBalancer LoadBalancer Save Failed ", err);

                        });
                }
                else {
                    logger.error("DVP-ClusterConfiguration.AddLoadBalancer Cloud NotFound ");
                    var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
                    res.write(instance);
                    res.end();

                }

            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.AddLoadBalancer Cloud NotFound ");
                var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
                res.write(instance);
                res.end();

            });


        }
        else {

            var instance = msg.FormatMessage(undefined, "Add LoadBalancer", status, undefined);
            res.write(instance);
            res.end();
            logger.debug("DVP-ClusterConfiguration.AddLoadBalancer Object Validation Failed ");

        }

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function ActivateCloud(req,res, id, activate) {


    logger.debug("DVP-ClusterConfiguration.ActivateCloud HTTP %s", id);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        var activeStatus = (activate === 'true');

        var status = false;
        var idx = parseInt(id);
        var outerror = undefined;
        dbmodel.Cloud.find({where: [{id: idx}, {CompanyId: company}, {TenantId: tenant}]}).then(function (cloudObject) {
            if (cloudObject) {

                logger.debug("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Found");


                cloudObject.updateAttributes({

                    Activate: activeStatus

                }).then(function (instance) {

                    if(instance)
                    {
                        redisCacheHandler.addClusterToCache(instance.id);
                    }


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

                }).catch(function (err) {

                    if (err) {

                        logger.error("DVP-ClusterConfiguration.ActivateCloud PGSQL Cloud Activation Failed", err);
                        outerror = err;

                        var instance = msg.FormatMessage(outerror, "Activate cloud", status, undefined);
                        res.write(instance);
                        res.end();


                    }
                })
            }
            else {
                logger.error("DVP-ClusterConfiguration.ActivateCloud Cloud NotFound");
                var instance = msg.FormatMessage(err, "Activate cloud", status, undefined);
                res.write(instance);
                res.end();

            }
        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.ActivateCloud Cloud NotFound", err);
            var instance = msg.FormatMessage(err, "Activate cloud", status, undefined);
            res.write(instance);
            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function CreateCallServer(res,req) {


    logger.debug("DVP-ClusterConfiguration.CreateCallServer HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        var model = 0;
        var status = false;
        var outerror = undefined;
        var csData = req.body;

        if (req.body  && csData.InternalMainIP && validator.isIP(csData.InternalMainIP)) {

            logger.debug("DVP-ClusterConfiguration.CreateCallServer Object Validated");



            var callserver = dbmodel.CallServer.build({
                Name: csData.Name,
                //ID: DataTypes.INTEGER,
                Activate: csData.Activate,
                Code: csData.Code,
                CompanyId: company,
                TenantId: tenant,
                Class: csData.Class,
                Type: csData.Type,
                Category: csData.Category,
                InternalMainIP: csData.InternalMainIP
            })


            callserver
                .save()
                .then(function (inst)
                {

                    if(inst)
                    {
                        redisCacheHandler.addCallServerByIdToCache(inst.id, inst);
                        redisCacheHandler.addCallServerToCompanyObj(inst, tenant, company);
                    }

                    logger.debug('DVP-ClusterConfiguration.CreateCluster PGSQL CallServer object saved successful');
                    status = true;


                    try {

                        var instance = msg.FormatMessage(outerror, "Create callserver", status, inst);
                        res.write(instance);
                        res.end();


                    }
                    catch (exp) {

                        console.log("There is a error in --> CreateCluster ", exp)

                    }
                }).catch(function (err) {

                    logger.error("DVP-ClusterConfiguration.CreateCallServer PGSQL CallServer Save Failed ", err);
                    var instance = msg.FormatMessage(err, "Create callserver", status, undefined);
                    res.write(instance);
                    res.end();

                });
        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateCallServer Object Validation Failed");
            var instance = msg.FormatMessage(undefined, "Create callserver", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }






}

function UniqueCode(res,req) {


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        var csData = req.body;
        dbmodel.CallServer.find({where: [{Code: csData.Code},{CompanyId: company}, {TenantId: tenant}]}).then(function (obj) {

            var isUniq = obj?false:true;
            var instance = msg.FormatMessage(true, "UniqueCode",isUniq, true);
            res.write(instance);
            res.end();

        }).catch(function (err) {

            var instance = msg.FormatMessage(false, "UniqueCode", false, false);
            res.write(instance);
            res.end();
        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }







}

function EditCallServer(Id, req, res) {


    var status = false;
    var outerror = undefined;

    logger.debug("DVP-ClusterConfiguration.EditCallServer HTTP id %s ", Id);

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        if (req.body) {


            logger.debug("DVP-ClusterConfiguration.EditCallServer Object Validated");


            var idx = parseInt(Id);
            dbmodel.CallServer.find({where: [{id: idx}, {Activate: true},{CompanyId: company}, {TenantId: tenant}]}).then(function (csInstance) {


                try {

                    logger.debug("DVP-ClusterConfiguration.EditCallServer id %d Found", Id);

                    var csData = req.body;

                    csInstance.updateAttributes({
                        Name: csData.Name,
                        //ID: DataTypes.INTEGER,
                        Activate: csData.Activate,
                        Code: csData.Code,
                        Class: csData.Class,
                        Type: csData.Type,
                        Category: csData.Category,
                        InternalMainIP: csData.InternalMainIP

                    }).then(function (instance) {

                        if(instance)
                        {
                            redisCacheHandler.addCallServerByIdToCache(instance.id, JSON.stringify(instance));
                            redisCacheHandler.addCallServerToCompanyObj(instance, tenant, company);
                        }

                        logger.debug('DVP-ClusterConfiguration.EditCallServer PGSQL CallServer object updated successful');
                        status = true;


                        try {

                            var instance = msg.FormatMessage(outerror, "Updated callserver", status, undefined);
                            res.write(instance);
                            res.end();


                        }
                        catch (exp) {

                            console.log("There is a error in --> Update Callserver ", exp)

                        }
                    }).catch(function (err) {

                        logger.error("DVP-ClusterConfiguration.EditCallServer PGSQL CallServer Save Failed ", err);
                        var instance = msg.FormatMessage(err, "Update callserver", status, undefined);
                        res.write(instance);
                        res.end();

                    });


                } catch (exp) {

                    logger.error("DVP-ClusterConfiguration.EditCallServer PGSQL CallServer Save Failed ", exp);

                }


            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.GetCallServerByID id %d Failed", Id, err);

                var instance = msg.FormatMessage(err, "Get callserver by ID", false, undefined);
                res.write(instance);

                res.end();

            });


        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateCallServer Object Validation Failed");
            var instance = msg.FormatMessage(undefined, "Create callserver", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function ActivateCallServer(req, res, id, activate) {

    logger.debug("DVP-ClusterConfiguration.ActivateCallServer HTTP %s ", id);


    var activeStatus = (activate === 'true');

    var idx = parseInt(id);
    var outerror = undefined;



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        var status = false;
        dbmodel.CallServer.find({where: [{id: idx}, {CompanyId: company}, {TenantId: tenant}]}).then(function (csObject) {
            if (csObject) {

                logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer Found");

                csObject.updateAttributes({

                    Activate: activeStatus

                }).then(function (instance) {

                    if(instance)
                    {
                        redisCacheHandler.addCallServerByIdToCache(instance.id, JSON.stringify(instance));
                        redisCacheHandler.addCallServerToCompanyObj(instance, tenant, company);
                    }

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


            else {
                logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer NotFound ", err);
                var instance = msg.FormatMessage(undefined, "Activate callserver", status, undefined);
                res.write(instance);
                res.end();

            }
        }).catch(function (err) {

            logger.debug("DVP-ClusterConfiguration.ActivateCallServer PGSQL CallServer NotFound ", err);
            var instance = msg.FormatMessage(undefined, "Activate callserver", status, undefined);
            res.write(instance);
            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function GetCallServerByID(req, res, Id) {


    logger.debug("DVP-ClusterConfiguration.GetCallServerByID HTTP id %s ", Id);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        var idx = parseInt(Id);
        dbmodel.CallServer.find({
            where: [{id: idx}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}],
            include: [{model: dbmodel.IPAddress, as: "IPAddress"}]
        }).then(function (csInstance) {


            try {
                var instance = msg.FormatMessage(undefined, "Get callserver by ID", true, csInstance);
                res.write(instance);

                logger.debug("DVP-ClusterConfiguration.GetCallServerByID id %d Found", Id);


            } catch (exp) {


            }

            res.end();

        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.GetCallServerByID id %d Failed", Id, err);

            var instance = msg.FormatMessage(err, "Get callserver by ID", false, undefined);
            res.write(instance);

            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function GetCallServers(req, res) {


    logger.debug("DVP-ClusterConfiguration.GetCallServers HTTP  ");

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.CallServer.findAll({where: [{Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (csInstance) {


            try {


                logger.debug("DVP-ClusterConfiguration.GetCallServers Found");

                var instance = msg.FormatMessage(undefined, "Get callservers", true, csInstance);
                res.write(instance);

            } catch (exp) {


            }

            res.end();

        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.GetCallServers Failed", err);

            var instance = msg.FormatMessage(err, "Get callservers", false, undefined);
            res.write(instance);
            res.end();


        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function RemoveCallServerFromCloud(req, res, Id, cloudID) {


    logger.debug("DVP-ClusterConfiguration.RemoveCallServerFromCloud id HTTP %s to %s", Id, cloudID);



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        dbmodel.CallServer.find({
            where: [{id: parseInt(Id)}, {CompanyId: company}, {TenantId: tenant}]
        }).then(function (csInstance) {

            if (csInstance) {

                logger.debug("DVP-ClusterConfiguration.RemoveCallServerFromCloud PGSQL Cloud %s Found", cloudID);


                csInstance.updateAttributes({
                        ClusterId: null
                }).then(function (instance)
                {
                    if(instance)
                    {
                        redisCacheHandler.addCallServerByIdToCache(instance.id, JSON.stringify(instance));
                        redisCacheHandler.addCallServerToCompanyObj(instance, tenant, company);
                    }

                    logger.debug("DVP-ClusterConfiguration.RemoveCallServerFromCloud PGSQL");

                    status = true;
                    var instance = msg.FormatMessage(undefined, "RemoveCallservers to cloud", status, undefined);
                    res.write(instance);
                    res.end();

                }).catch(function(ex)
                {

                    status = false;
                    var instance = msg.FormatMessage(err, "RemoveCallservers to cloud", status, undefined);
                    res.write(instance);
                    res.end();

                });



            } else {

                logger.error("DVP-ClusterConfiguration.RemoveCallServerFromCloud PGSQL Cloud %s NotFound", cloudID);

                var instance = msg.FormatMessage(undefined, "RemoveCallservers to cloud", status, undefined);
                res.write(instance);

                res.end();
            }


        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.RemoveCallServerFromCloud PGSQL Cloud %s NotFound", cloudID, err);

            var instance = msg.FormatMessage(undefined, "RemoveCallservers to cloud", status, undefined);
            res.write(instance);

            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



    var status = false;





}

function AddCallServerToCloud(req, res, Id, cloudID) {


    logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud id HTTP %s to %s", Id, cloudID);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        var status = false;
        dbmodel.CallServer.find({where: [{id: parseInt(Id)}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (csInstance) {

            if (csInstance) {

                logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL CallServer %s Found", Id);


                dbmodel.Cloud.find({where: [{id: parseInt(cloudID)}, {Activate: true}]}).then(function (cloudInstance) {

                    if (cloudInstance) {

                        logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL Cloud %s Found", cloudID);

                        cloudInstance.addCallServer(csInstance).then(function (instance) {

                            if(instance)
                            {
                                redisCacheHandler.addCallServerByIdToCache(instance.id, JSON.stringify(instance));
                                redisCacheHandler.addCallServerToCompanyObj(instance, tenant, company);
                            }

                            logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL");

                            status = true;
                            var instance = msg.FormatMessage(undefined, "AddCallservers to cloud", status, undefined);
                            res.write(instance);
                            res.end();

                        }).catch(function (err) {

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


                }).catch(function (err) {

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

        }).catch(function (err) {

            logger.debug("DVP-ClusterConfiguration.AddCallServerToCloud PGSQL CallServer %s NotFound", Id, err);

            var instance = msg.FormatMessage(undefined, "AddCallservers to cloud", status, undefined);
            res.write(instance);
            res.end();
        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function SetParentCloud(req,res, chilid, parentid) {


    logger.debug("DVP-ClusterConfiguration.SetParentCloud HTTP id %s to %s", chilid, parentid);

    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        var status = false;
        dbmodel.Cloud.find({where: [{id: parseInt(chilid)}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (childInstance) {

            if (childInstance && childInstance.CloudModel > 1) {


                logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL ChildCloud %s Found", chilid);

                dbmodel.Cloud.find({where: [{id: parseInt(parentid)}, {Activate: true}]}).then(function (parentInstance) {

                    if (parentInstance && (childInstance.id != parentInstance.id) && childInstance.CloudModel == 1) {

                        logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL ParentCloud %s Found", parentid);


                        childInstance.setParentCloud(parentInstance).then(function (cloudInstancex) {

                            if(childInstance)
                            {
                                redisCacheHandler.addClusterToCache(childInstance.id);
                            }


                            logger.debug("DVP-ClusterConfiguration.SetParentCloud PGSQL");


                            status = true;
                            var instance = msg.FormatMessage(undefined, "Set ParentCloud", status, undefined);
                            res.write(instance);
                            res.end();

                        }).catch(function (err) {

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


                }).catch(function (err) {


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

        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.SetParentCloud PGSQL ChildCloud %s NotFound", chilid, err);

            var instance = msg.FormatMessage(err, "Set ParentCloud No Cloud", status, undefined);
            res.write(instance);

            res.end();


        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function GetNetworks(req, res) {

    logger.debug("DVP-ClusterConfiguration.GetNetworks HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.Network.findAll({where: [{CompanyId: company}, {TenantId: tenant}]}).then(function (network) {


            logger.debug("DVP-ClusterConfiguration.GetNetworks PGSQL Network Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get Networks", true, network);
                res.write(instance);


            } catch (exp) {


            }


            res.end();
        }).catch(function (err) {

            logger.debug("DVP-ClusterConfiguration.GetNetworks PGSQL Network NotFound", err);


            var instance = msg.FormatMessage(err, "Get Networks", false, undefined);
            res.write(instance);

            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function GetNetwork(id, req, res) {

    logger.debug("DVP-ClusterConfiguration.GetNetwork HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;




        dbmodel.Network.find({where: [{id: id},{CompanyId: company}, {TenantId: tenant}]}).then(function (network) {


            logger.debug("DVP-ClusterConfiguration.GetNetwork PGSQL Network Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get Network", true, network);
                res.write(instance);


            } catch (exp) {


            }


            res.end();
        }).catch(function (err) {

            logger.debug("DVP-ClusterConfiguration.GetNetwork PGSQL Network NotFound", err);


            var instance = msg.FormatMessage(err, "Get Network", false, undefined);
            res.write(instance);

            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function DeleteNetwork(id, req, res) {

    logger.debug("DVP-ClusterConfiguration.GetNetwork HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.Network.find({where: [{id: id},{CompanyId: company}, {TenantId: tenant}]}).then(function (network) {


            logger.debug("DVP-ClusterConfiguration.GetNetwork PGSQL Network Found");


            try {

                if (network) {

                    network.destroy().then(function (obj) {

                        var instance = msg.FormatMessage(undefined, "Delete Network succeed", true, obj);
                        res.write(instance);
                        res.end();


                    }).catch(function (err) {

                        var instance = msg.FormatMessage(err, "Delete Network", false, undefined);
                        res.write(instance);
                        res.end();


                    });


                }
                else {

                    var instance = msg.FormatMessage(undefined, "Delete Network, No network found", false, undefined);
                    res.write(instance);
                    res.end();
                }


            } catch (exp) {

                var instance = msg.FormatMessage(exp, "Delete Network exception recived", false, undefined);
                res.write(instance);
                res.end();

            }


        }).catch(function (err) {

            logger.debug("DVP-ClusterConfiguration.GetNetwork PGSQL Network NotFound", err);


            var instance = msg.FormatMessage(err, "Get Network", false, undefined);
            res.write(instance);

            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function GetNetworkByClusterID(req, res, Id) {

    logger.debug("DVP-ClusterConfiguration.GetNetworkByClusterID HTTP id %d", Id);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.Cloud.find({
            where: [{id: parseInt(Id)}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}],
            include: [{model: dbmodel.Network, as: "Network"}]
        }).then(function (cloudInstance) {


            try {


                logger.debug("DVP-ClusterConfiguration.GetNetworkByClusterID PGSQL id %s found", Id);

                var instance = msg.FormatMessage(undefined, "Get Network by ClusterID", true, cloudInstance.Network);
                res.write(instance);

            } catch (exp) {

                logger.error("DVP-ClusterConfiguration.GetNetworkByClusterID stringify json id %s failed", Id, exp);
                //res.write("");

            }


            res.end();

        }).catch(function (err) {

            var instance = msg.FormatMessage(err, "Get Network by ClusterID", false, undefined);
            res.write(instance);


            res.end();

        })


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function CreateTelcoNetwork(res, req) {


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


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        var model = 0;
        var status = false;
        var outerror = undefined;
        if (req.body) {

            logger.debug("DVP-ClusterConfiguration.CreateTelcoNetwork Object Validated", req.body);


            var networkData = req.body;


            var network = dbmodel.Network.build({
                Type: "TELCO",
                Owner: 0,
                Network: networkData.Network,
                Mask: networkData.Mask,
                NATIP: networkData.NATIP,
                CompanyId: company,
                TenantId: tenant


            })


            network
                .save()
                .then(function (inst) {


                    logger.debug('DVP-ClusterConfiguration.CreateTelcoNetwork PGSQL TelcoNetwork object saved successful');
                    status = true;


                    try {

                        var instance = msg.FormatMessage(undefined, "Create Telco Network", status, inst);
                        res.write(instance);
                        res.end();


                    }
                    catch (exp) {

                        console.log("There is a error in --> CreateCluster ", exp)

                    }
                }).catch(function (err) {


                    logger.error("DVP-ClusterConfiguration.CreateTelcoNetwork PGSQL TelcoNetwork Save Failed ", err);

                    var instance = msg.FormatMessage(err, "Create Telco Network", status, undefined);
                    res.write(instance);
                    res.end();


                });


        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateTelcoNetwork Object Validation Failed");
            var instance = msg.FormatMessage(undefined, "Create Telco Network", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }






}

function CreateEndUserNetwork(res, req) {





    logger.debug("DVP-ClusterConfiguration.CreateEndUserNetwork HTTP");



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        var model = 0;
        var status = false;
        if (req.body) {

            logger.debug("DVP-ClusterConfiguration.CreateEndUserNetwork Object Validated", req.body);


            var networkData = req.body;


            var network = dbmodel.Network.build({
                Type: "USER",
                Owner: 0,
                Network: networkData.Network,
                Mask: networkData.Mask,
                NATIP: networkData.NATIP,
                CompanyId: company,
                TenantId: tenant


            })


            network
                .save()
                .then(function (inst) {


                    logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL UserNetwork object saved successful');
                    status = true;


                    try {

                        var instance = msg.FormatMessage(undefined, "Create User Network", status, inst);
                        res.write(instance);
                        res.end();


                    }
                    catch (exp) {

                        console.log("There is a error in --> CreateCluster ", exp)

                    }
                }).catch(function (err) {

                    logger.error("DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL UserNetwork Save Failed ", err);
                    var instance = msg.FormatMessage(err, "Create User Network", status, undefined);
                    res.write(instance);
                    res.end();


                });


        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateEndUserNetwork Object Validation Failed");
            var instance = msg.FormatMessage(undefined, "Create User Network", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function EditNetwork(id, req, res) {

    logger.debug("DVP-ClusterConfiguration.EditNetwork HTTP")


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        dbmodel.Network.find({where: [{id: id},{CompanyId: company}, {TenantId: tenant}]}).then(function (network) {


            logger.debug("DVP-ClusterConfiguration.EditNetwork PGSQL Network Found");

            if (network) {

                try {


                    var status = false;
                    if (req.body) {

                        logger.debug("DVP-ClusterConfiguration.EditNetwork Object Validated");


                        var networkData = req.body;


                        network.updateAttributes({


                            Mask: networkData.Mask,
                            NATIP: networkData.NATIP


                        }).then(function (instance) {


                            logger.debug('DVP-ClusterConfiguration.EditNetwork PGSQL Network object updated successful');
                            status = true;


                            try {

                                var instance = msg.FormatMessage(undefined, "Update User Network success", status, instance);
                                res.write(instance);
                                res.end();


                            }
                            catch (exp) {

                                console.log("There is a error in --> Edit Network ", exp)
                                res.end();
                            }
                        }).catch(function (err) {

                            logger.error("DVP-ClusterConfiguration.EditNetwork PGSQL Network Update Failed ", err);
                            var instance = msg.FormatMessage(err, "Update User Network error", status, undefined);
                            res.write(instance);
                            res.end();


                        });


                    }
                    else {

                        logger.error("DVP-ClusterConfiguration.CreateEndUserNetwork Object Validation Failed");
                        var instance = msg.FormatMessage(undefined, "Update User Network error", status, undefined);
                        res.write(instance);
                        res.end();

                    }


                } catch (exp) {

                    var instance = msg.FormatMessage(err, "Edit Network error", false, undefined);
                    res.write(instance);

                    res.end();


                }
            } else {
                var instance = msg.FormatMessage(undefined, "Edit Network, Network not found", false, undefined);
                res.write(instance);

                res.end();

            }

        }).catch(function (err) {

            logger.debug("DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL Network NotFound", err);


            var instance = msg.FormatMessage(err, "Edit Network, Network not found", false, undefined);
            res.write(instance);

            res.end();

        });



    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function SetTelcoNetworkToCloud(req,res, networkId, cloudId) {
    var status = false;

    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud HTTP id %s to %s", networkId, cloudId);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        dbmodel.Network.find({where: [{id: parseInt(networkId)},{CompanyId: company}, {TenantId: tenant}]}).then(function (networkInstance) {

            if (networkInstance) {

                logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Network %s Found", networkId);

                dbmodel.Cloud.find({where: [{id: parseInt(cloudId)},{CompanyId: company}, {TenantId: tenant}, {Activate: true}]}).then(function (cloudInstance) {

                    if (cloudInstance) {


                        logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Cloud %s Found", cloudId);

                        cloudInstance.addNetwork(networkInstance).then(function (cloudInstancex) {


                            logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL");

                            status = true;
                            var instance = msg.FormatMessage(undefined, "Set Telco Network cloud", status, undefined);
                            res.write(instance);
                            res.end();

                        }).catch(function (err) {

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


                }).catch(function (err) {

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

        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL Network %s NotFound ", networkId, err);

            var instance = msg.FormatMessage(err, "Set Telco Network NotFound", status, undefined);
            res.write(instance);
            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function RemoveTelcoNetworkFromCloud(req,res, networkId, cloudId) {
    var status = false;

    logger.debug("DVP-ClusterConfiguration.RemoveTelcoNetworkFromCloud HTTP id %s to %s", networkId, cloudId);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        dbmodel.Cloud.find({
            where: [{id: parseInt(cloudId)}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}],
            include: [{model: dbmodel.Network, as: "Network", where: [{id: parseInt(networkId)},{CompanyId: company}, {TenantId: tenant}]}]
        }).then(function (cloudInstance) {

            if (cloudInstance) {


                logger.debug("DVP-ClusterConfiguration.RemoveTelcoNetworkFromCloud PGSQL Cloud %s Found", cloudId);

                cloudInstance.removeNetwork(cloudInstance.Network).then(function (cloudInstancex) {


                    logger.debug("DVP-ClusterConfiguration.RemoveTelcoNetworkFromCloud PGSQL");

                    status = true;
                    var instance = msg.FormatMessage(undefined, "Remove Telco Network cloud", status, undefined);
                    res.write(instance);
                    res.end();

                }).catch(function (err) {

                    status = false;
                    var instance = msg.FormatMessage(err, "Remove Telco Network cloud", status, undefined);
                    res.write(instance);
                    res.end();

                });

            } else {

                logger.error("DVP-ClusterConfiguration.RemoveTelcoNetworkFromCloud PGSQL Cloud %s NotFound ", cloudId);
                var instance = msg.FormatMessage(err, "Remove Telco Network cloud NotFound", status, undefined);
                res.write(instance);
                res.end();
            }


        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.RemoveTelcoNetworkFromCloud PGSQL Cloud %s NotFound ", cloudId, err);
            var instance = msg.FormatMessage(err, "Remove Telco Network cloud NotFound", status, undefined);
            res.write(instance);
            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function SetTelcoNetworkToUSer(req,res, networkId, userID) {
    var status = false;

    logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer HTTP id %s to %s", networkId, userID);



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.Network.find({where: [{id: parseInt(networkId)},{CompanyId: company}, {TenantId: tenant}]}).then(function (networkInstance) {

            if (networkInstance) {

                logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL Network %s Found", networkId);

                dbmodel.CloudEndUser.find({where: [{id: parseInt(userID)},{CompanyId: company}, {TenantId: tenant}]}).then(function (userInstance) {

                    if (userInstance) {

                        logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToCloud PGSQL CloudEndUser %s Found", userID);

                        userInstance.setNetwork(networkInstance).then(function (cloudInstancex) {


                            logger.debug("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL");

                            if (!errx)
                                status = true;
                            var instance = msg.FormatMessage(undefined, "Set Telco Network To User", status, undefined);
                            res.write(instance);
                            res.end();

                        }).catch(function (err) {

                            status = false;
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


                }).catch(function (err) {

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

        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.SetTelcoNetworkToUSer PGSQL Network %s NotFound", networkId, err);

            var instance = msg.FormatMessage(err, "Set Telco Network To Network NotFound", status, undefined);
            res.write(instance);
            res.end();


        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function RemoveTelcoNetworkFromUser(req,res, networkId, userID) {
    var status = false;

    logger.debug("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser HTTP id %s to %s", networkId, userID);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.Network.find({where: [{id: parseInt(networkId)}, {CompanyId: company}, {TenantId: tenant}]}).then(function (networkInstance) {

            if (networkInstance) {

                logger.debug("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser PGSQL Network %s Found", networkId);

                dbmodel.CloudEndUser.find({where: [{id: parseInt(userID)},{CompanyId: company}, {TenantId: tenant}]}).then(function (userInstance) {

                    if (userInstance) {

                        logger.debug("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser PGSQL CloudEndUser %s Found", userID);

                        userInstance.removeNetwork(networkInstance).then(function (cloudInstancex) {


                            logger.debug("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser PGSQL");

                            if (!errx)
                                status = true;
                            var instance = msg.FormatMessage(undefined, "Remove Telco Network To User", status, undefined);
                            res.write(instance);
                            res.end();

                        }).catch(function (err) {

                            status = false;
                            var instance = msg.FormatMessage(err, "Remove Telco Network To User", status, undefined);
                            res.write(instance);
                            res.end();


                        });

                    } else {

                        logger.error("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser PGSQL CloudEndUser %s NotFound", userID);

                        var instance = msg.FormatMessage(err, "Remove Telco Network To User NotFound", status, undefined);
                        res.write(instance);
                        res.end();
                    }


                }).catch(function (err) {

                    logger.error("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser PGSQL CloudEndUser %s NotFound", userID, err);

                    var instance = msg.FormatMessage(err, "Remove Telco Network To User NotFound", status, undefined);
                    res.write(instance);
                    res.end();


                });

            } else {

                logger.error("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser PGSQL Network %s NotFound", networkId);

                var instance = msg.FormatMessage(err, "Remove Telco Network To Network NotFound", status, undefined);
                res.write(instance);
                res.end();
            }

        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.RemoveTelcoNetworkFromUser PGSQL Network %s NotFound", networkId, err);

            var instance = msg.FormatMessage(err, "Remove Telco Network To Network NotFound", status, undefined);
            res.write(instance);
            res.end();


        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function CreateEndUser(res, req) {


    logger.debug("DVP-ClusterConfiguration.CreateEndUser HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        var provision = 0;
        var status = false;
        if (req.body) {


            logger.debug("DVP-ClusterConfiguration.CreateEndUser Object Validated", req.body);


            var userData = req.body;

            dbmodel.Cloud.find({where: [{id: userData.ClusterID}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (cloudObject) {
                if (cloudObject) {


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
                        CompanyId: userData.ClientCompany,
                        TenantId: userData.ClientTenant,
                        SIPConnectivityProvision: provision

                    });


                    user
                        .save()
                        .then(function (instance) {


                            logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser object saved successful');
                            status = true;


                            cloudObject.addCloudEndUser(user).then(function (cloudInstancex) {

                                if(cloudInstancex)
                                {
                                    redisCacheHandler.addCloudEndUserToCompanyObj(cloudInstancex, cloudInstancex.CompanyId, cloudInstancex.TenantId);
                                }

                                logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser added to Cloud ');

                                    status = true;

                            }).catch(function (err) {

                                if(instance)
                                {
                                    redisCacheHandler.addCloudEndUserToCompanyObj(instance, instance.CompanyId, instance.TenantId);
                                }

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
                        }).catch(function (err) {

                            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL CloudEnduser Save Failed ", err);
                            status = false;
                            var instance = msg.FormatMessage(err, "Create EndUser", status, undefined);
                            res.write(instance);
                            res.end();

                        });

                }
                else {

                    logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID);
                    var instance = msg.FormatMessage(new Error('Create EndUser failed'), "Create EndUser failed", status, undefined);
                    res.write(instance);
                    res.end();

                }
            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID, err);
                var instance = msg.FormatMessage(err, "Create EndUser failed", status, undefined);
                res.write(instance);
                res.end();

            });


        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Object Validation failed");
            var instance = msg.FormatMessage(undefined, "Create EndUser failed", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(new Error('Token error, no company data found'), "Token error, no company data found", false, undefined));
        res.end();

    }





}


function CreateDefaultEndUser(res, req) {


    logger.debug("DVP-ClusterConfiguration.CreateEndUser HTTP");


    if(req&& req.user && req.user.company && req.user.tenant)
    {

        var provision = 0;
        var status = false;
        if (req.body)
        {
            logger.debug("DVP-ClusterConfiguration.CreateEndUser Object Validated", req.body);


            var userData = req.body;

            dbmodel.Cloud.find({where: [{Name: userData.ClusterName}, {Activate: true}]}).then(function (cloudObject) {
                if (cloudObject) {


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
                        CompanyId: userData.ClientCompany,
                        TenantId: userData.ClientTenant,
                        SIPConnectivityProvision: provision

                    });


                    user
                        .save()
                        .then(function (instance) {


                            logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser object saved successful');
                            status = true;


                            cloudObject.addCloudEndUser(user).then(function (cloudInstancex) {

                                if(cloudInstancex)
                                {
                                    redisCacheHandler.addCloudEndUserToCompanyObj(cloudInstancex, cloudInstancex.CompanyId, cloudInstancex.TenantId);
                                }

                                logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser added to Cloud ');

                                status = true;

                            }).catch(function (err) {

                                if(instance)
                                {
                                    redisCacheHandler.addCloudEndUserToCompanyObj(instance, instance.CompanyId, instance.TenantId);
                                }

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
                        }).catch(function (err) {

                            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL CloudEnduser Save Failed ", err);
                            status = false;
                            var instance = msg.FormatMessage(err, "Create EndUser", status, undefined);
                            res.write(instance);
                            res.end();

                        });

                }
                else {

                    logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID);
                    var instance = msg.FormatMessage(new Error('Create EndUser failed'), "Create EndUser failed", status, undefined);
                    res.write(instance);
                    res.end();

                }
            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID, err);
                var instance = msg.FormatMessage(err, "Create EndUser failed", status, undefined);
                res.write(instance);
                res.end();

            });


        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Object Validation failed");
            var instance = msg.FormatMessage(undefined, "Create EndUser failed", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(new Error('Token error, no company data found'), "Token error, no company data found", false, undefined));
        res.end();

    }

}

function UpdateEndUser(res, req) {


    logger.debug("DVP-ClusterConfiguration.UpdateEndUser HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        var provision = 0;
        var status = false;
        if (req.body) {


            logger.debug("DVP-ClusterConfiguration.UpdateEndUser Object Validated", req.body);


            var userData = req.body;


            dbmodel.CloudEndUser.find({where: [{id: req.params.id}, {CompanyId: company}, {TenantId: tenant}]}).then(function (cloudUserObject) {
                if (!cloudUserObject) {

                    status = false;

                    logger.error("DVP-ClusterConfiguration.UpdateEndUser PGSQL Cloud End user %d not found", id);
                    var instance = msg.FormatMessage(new Error("No user found"), "No user found", status, undefined);
                    res.write(instance);
                    res.end();
                }
                else {

                    cloudUserObject.updateAttributes({

                        Domain: userData.Domain,
                        SIPConnectivityProvision: userData.SIPConnectivityProvision


                    }).then(function (updtObj) {

                        if(updtObj)
                        {
                            redisCacheHandler.addCloudEndUserToCompanyObj(updtObj, company, tenant);
                        }


                        logger.debug('DVP-ClusterConfiguration.UpdateEndUser PGSQL Cloud End User object updated successfully');
                        status = true;
                        var instance = msg.FormatMessage(undefined, "Cluster Update", status, updtObj);
                        res.write(instance);
                        res.end();


                    }).catch(function (err) {

                        status = false;

                        logger.error("DVP-ClusterConfiguration.EditCluster PGSQL Update failed ", err);
                        var instance = msg.FormatMessage(err, "Cluster Update Error", status, undefined);
                        res.write(instance);
                        res.end();


                    });


                    var instance = msg.FormatMessage(err, "Update EndUser failed", status, undefined);
                    res.write(instance);
                    res.end();

                }
            }).catch(function (err) {


            });


        }
        else {

            logger.error("DVP-ClusterConfiguration.UpdateEndUser PGSQL Object Validation failed");
            var instance = msg.FormatMessage(undefined, "Update EndUser failed", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function GetEndUsers(req, res) {


    logger.debug("DVP-ClusterConfiguration.EndUsers HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.CloudEndUser.findAll({where:[{CompanyId: company}, {TenantId: tenant}]}).then(function (enduser) {


            logger.debug("DVP-ClusterConfiguration.EndUser PGSQL EndUsers Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get EndUser", true, enduser);
                res.write(instance);
                res.end();
            } catch (exp) {


            }


        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.EndUsers PGSQL EndUser NotFound", err);
            var instance = msg.FormatMessage(err, "Get EndUser failed", false, undefined);
            res.write(instance);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function CreateEndUserTenant(res, req) {


    logger.debug("DVP-ClusterConfiguration.CreateEndUser HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        var status = false;
        if (req.body) {


            logger.debug("DVP-ClusterConfiguration.CreateEndUser Object Validated", req.body);


            var userData = req.body;

            dbmodel.Cloud.find({where: [{id: userData.ClusterID}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (cloudObject) {
                if (cloudObject) {


                    var user = dbmodel.CloudEndUser.build({
                        Domain: userData.Domain,
                        CompanyId: userData.ClientCompany,
                        TenantId: tenant,
                        SIPConnectivityProvision: userData.SIPConnectivityProvision

                    });


                    user
                        .save()
                        .then(function (instance) {


                            logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser object saved successful');
                            status = true;


                            cloudObject.addCloudEndUser(user).then(function (cloudInstancex) {

                                if(cloudInstancex)
                                {
                                    redisCacheHandler.addCloudEndUserToCompanyObj(cloudInstancex, cloudInstancex.CompanyId, cloudInstancex.TenantId);
                                }

                                logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL CloudEnduser added to Cloud ');

                                status = true;

                            }).catch(function (err) {

                                if(instance)
                                {
                                    redisCacheHandler.addCloudEndUserToCompanyObj(instance, instance.CompanyId, instance.TenantId);
                                }

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
                        }).catch(function (err) {

                            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL CloudEnduser Save Failed ", err);
                            status = false;
                            var instance = msg.FormatMessage(err, "Create EndUser", status, undefined);
                            res.write(instance);
                            res.end();

                        });

                }
                else {

                    logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID);
                    var instance = msg.FormatMessage(new Error('Create EndUser failed'), "Create EndUser failed", status, undefined);
                    res.write(instance);
                    res.end();

                }
            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Cloud %d NotFound", userData.clusterID, err);
                var instance = msg.FormatMessage(err, "Create EndUser failed", status, undefined);
                res.write(instance);
                res.end();

            });


        }
        else {

            logger.error("DVP-ClusterConfiguration.CreateEndUser PGSQL Object Validation failed");
            var instance = msg.FormatMessage(undefined, "Create EndUser failed", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(new Error('Token error, no company data found'), "Token error, no company data found", false, undefined));
        res.end();

    }





}

function UpdateEndUserTenant(res, req) {


    logger.debug("DVP-ClusterConfiguration.UpdateEndUser HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        var provision = 0;
        var status = false;
        if (req.body) {


            logger.debug("DVP-ClusterConfiguration.UpdateEndUser Object Validated", req.body);


            var userData = req.body;


            dbmodel.CloudEndUser.find({where: [{id: req.params.id}, {CompanyId: userData.ClientCompany}, {TenantId: tenant}]}).then(function (cloudUserObject) {
                if (!cloudUserObject) {

                    status = false;

                    logger.error("DVP-ClusterConfiguration.UpdateEndUser PGSQL Cloud End user %d not found", id);
                    var instance = msg.FormatMessage(new Error("No user found"), "No user found", status, undefined);
                    res.write(instance);
                    res.end();
                }
                else {

                    cloudUserObject.updateAttributes({

                        Domain: userData.Domain,
                        SIPConnectivityProvision: userData.SIPConnectivityProvision


                    }).then(function (updtObj) {

                        if(updtObj)
                        {
                            redisCacheHandler.addCloudEndUserToCompanyObj(updtObj, company, tenant);
                        }


                        logger.debug('DVP-ClusterConfiguration.UpdateEndUser PGSQL Cloud End User object updated successfully');
                        status = true;
                        var instance = msg.FormatMessage(undefined, "Cluster Update", status, updtObj);
                        res.write(instance);
                        res.end();


                    }).catch(function (err) {

                        status = false;

                        logger.error("DVP-ClusterConfiguration.EditCluster PGSQL Update failed ", err);
                        var instance = msg.FormatMessage(err, "Cluster Update Error", status, undefined);
                        res.write(instance);
                        res.end();


                    });


                    var instance = msg.FormatMessage(err, "Update EndUser failed", status, undefined);
                    res.write(instance);
                    res.end();

                }
            }).catch(function (err) {


            });


        }
        else {

            logger.error("DVP-ClusterConfiguration.UpdateEndUser PGSQL Object Validation failed");
            var instance = msg.FormatMessage(undefined, "Update EndUser failed", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function GetEndUsersTenant(req, res) {


    logger.debug("DVP-ClusterConfiguration.EndUsers HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.params.ClientCompany;
        tenant = req.user.tenant;

        dbmodel.CloudEndUser.findAll({where:[{CompanyId: company}, {TenantId: tenant}]}).then(function (enduser) {


            logger.debug("DVP-ClusterConfiguration.EndUser PGSQL EndUsers Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get EndUser", true, enduser);
                res.write(instance);
                res.end();
            } catch (exp) {


            }


        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.EndUsers PGSQL EndUser NotFound", err);
            var instance = msg.FormatMessage(err, "Get EndUser failed", false, undefined);
            res.write(instance);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function DeleteEndUser(req,res, userID) {


    logger.debug("DVP-ClusterConfiguration.DeleteEndUser HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        var status = false;


        dbmodel.CloudEndUser.find({where: [{id: userID}, {CompanyId: company}, {TenantId: tenant}]}).then(function (cloudUserObject) {
            if (!cloudUserObject) {

                status = false;

                logger.error("DVP-ClusterConfiguration.DeleteEndUser PGSQL Cloud End user %d not found", id);
                var instance = msg.FormatMessage(new Error("No user found"), "No user found", status, undefined);
                res.write(instance);
                res.end();
            }
            else {

                cloudUserObject.destroy().then(function (delObj) {

                    redisCacheHandler.removeCloudEndUserFromCompanyObj(userID, company, tenant);

                    logger.debug('DVP-ClusterConfiguration.DeleteEndUser PGSQL Cloud End User removed successfully');
                    status = true;
                    var instance = msg.FormatMessage(undefined, "Cluster Delete", status, delObj);
                    res.write(instance);
                    res.end();
                }).catch(function (errObj) {

                    status = false;

                    logger.error("DVP-ClusterConfiguration.DeleteEndUser PGSQL deletion failed ", errObj);
                    var instance = msg.FormatMessage(errObj, "Cloud Enduser deletion  Error", status, undefined);
                    res.write(instance);
                    res.end();

                });


            }
        }).catch(function (err) {

            status = false;
            logger.error("DVP-ClusterConfiguration.DeleteEndUser PGSQL User %d NotFound", userID, err);
            var instance = msg.FormatMessage(err, "Deletion of EndUser failed", status, undefined);
            res.write(instance);
            res.end();

        });



    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function GetEndUser(id, req, res) {


    logger.debug("DVP-ClusterConfiguration.EndUsers HTTP");



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        dbmodel.CloudEndUser.find({where: [{id: id}, {CompanyId: company}, {TenantId: tenant}]}).then(function (enduser) {


            logger.debug("DVP-ClusterConfiguration.EndUsers PGSQL EndUsers Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get EndUsers", true, enduser);
                res.write(instance);
                res.end();
            } catch (exp) {


            }


        }).catch(function (err) {


            logger.error("DVP-ClusterConfiguration.EndUserss PGSQL EndUser NotFound", err);
            var instance = msg.FormatMessage(err, "Get EndUsers failed", false, undefined);
            res.write(instance);
            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }

}

function GetEndUsersByClusterID(req, res, Id) {

    logger.debug("DVP-ClusterConfiguration.GetEndUsersByClusterID HTTP id %d", Id);


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.Cloud.find({
            where: [{id: parseInt(Id)}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}],
            include: [{model: dbmodel.CloudEndUser, as: "CloudEndUser"}]
        }).then(function (cloudInstance) {


            var instanceout;

            try {


                logger.debug("DVP-ClusterConfiguration.GetEndUsersByClusterID PGSQL id %s found", Id);
                instanceout = msg.FormatMessage(undefined, "Get EndUser by CloudID", true, cloudInstance.CloudEndUser);


            } catch (exp) {

                logger.error("DVP-ClusterConfiguration.GetEndUsersByClusterID stringify json %s failed", Id, exp);
                instanceout = msg.FormatMessage(exp, "Get EndUser by CloudID failed", false, undefined);


            }

            res.write(instanceout);
            res.end();


        }).catch(function (err) {


            var instanceout = msg.FormatMessage(err, "Get EndUser by CloudID failed", false, undefined);
            res.write(instanceout);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function CreateSipProfile(res, req) {


    logger.debug("DVP-ClusterConfiguration.CreateSipProfile HTTP");


    var company;
    var tenant;

    if(req && req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;



        var status = false;

        if (req.body) {


            logger.error("DVP-ClusterConfiguration.CreateSipProfile Object Validated");


            var profileInfo = req.body;


            var profile = dbmodel.SipNetworkProfile.build({
                ProfileName: profileInfo.ProfileName,
                MainIp: profileInfo.MainIp,
                InternalIp: profileInfo.InternalIp,
                InternalRtpIp: profileInfo.InternalRtpIp,
                ExternalIp: profileInfo.ExternalIp,
                ExternalRtpIp: profileInfo.ExternalRtpIp,
                Port: profileInfo.Port,
                ObjClass: profileInfo.ObjClass,
                ObjType: profileInfo.ObjType,
                ObjCategory: profileInfo.ObjCategory,
                CompanyId: company,
                TenantId: tenant
            });


            dbmodel.IPAddress.find({where: [{IP: profileInfo.InternalIp},{CompanyId: company}, {TenantId: tenant}]}).then(function (ipAddress) {

                if (ipAddress && ipAddress.IsAllocated) {

                    profile
                        .save()
                        .then(function (obj) {

                            redisCacheHandler.addSipProfileToCompanyObj(obj, tenant, company);

                            logger.error("DVP-ClusterConfiguration.CreateSipProfile PGSQL SipProfile save Failed");
                            var instance = msg.FormatMessage(undefined, "Create SipProfile failed", true, obj);
                            res.write(instance);
                            res.end();


                        }).catch(function (err) {

                            logger.error("DVP-ClusterConfiguration.CreateSipProfile PGSQL SipProfile save Failed");
                            var instance = msg.FormatMessage(err, "Create SipProfile failed", status, undefined);
                            res.write(instance);
                            res.end();


                        });


                } else {

                    logger.error("DVP-ClusterConfiguration.CreateSipProfile PGSQL SipProfile profile find Failed");
                    var instance = msg.FormatMessage(undefined, "Create SipProfile, Profile find failed", status, undefined);
                    res.write(instance);
                    res.end();

                }

            }).catch(function (err) {

                logger.error("DVP-ClusterConfiguration.CreateSipProfile PGSQL SipProfile object save Failed");
                var instance = msg.FormatMessage(err, "Create SipProfile failed", status, undefined);
                res.write(instance);
                res.end();


            });


            /*
             profileHandler.addSipNetworkProfile(userData, function (err, id, sta) {

             if (err) {

             logger.error("DVP-ClusterConfiguration.CreateSipProfile PGSQL SipProfile object save Failed");
             var instance = msg.FormatMessage(err, "Create SipProfile failed", status, undefined);
             res.write(instance);
             res.end();

             } else {

             status = true;
             logger.debug('DVP-ClusterConfiguration.CreateEndUserNetwork PGSQL SipProfile object saved successful');
             var instance = msg.FormatMessage(undefined, "Create SipProfile done", status, undefined);
             res.write(instance);
             res.end();

             }

             });

             */
        }
        else {
            logger.error("DVP-ClusterConfiguration.CreateSipProfile Object Validation failed");
            var instance = msg.FormatMessage(undefined, "Create SipProfile done", status, undefined);
            res.write(instance);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }





}

function GetProfileByID(req, res, id) {


    logger.debug("DVP-ClusterConfiguration.GetProfileByID HTTP");



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.SipNetworkProfile.find({where: [{id: parseInt(id)},{CompanyId: company}, {TenantId: tenant}]}).then(function (profile) {


            logger.debug("DVP-ClusterConfiguration.GetProfileByID PGSQL SipProfile %s Found", id);


            try {
                var instance = msg.FormatMessage(undefined, "Get Profile ByID", true, profile);
                res.write(instance);
                res.end();
            } catch (exp) {

                //res.write("");

            }


        }).catch(function (err) {


            logger.debug("DVP-ClusterConfiguration.GetProfileByID PGSQL SipProfile %s NotFound", id, err);


            var instance = msg.FormatMessage(err, "Get Profile ByID failed", false, undefined);
            res.write(instance);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function GetProfiles(req, res) {


    logger.debug("DVP-ClusterConfiguration.GetProfiles HTTP");



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.SipNetworkProfile.findAll({where: [{CompanyId: company}, {TenantId: tenant}]}).then(function (profile) {


            logger.debug("DVP-ClusterConfiguration.GetProfiles PGSQL SipProfile Found");


            try {
                var instance = msg.FormatMessage(undefined, "Get Profiles", true, profile);
                res.write(instance);
                res.end();
            } catch (exp) {

                //res.write("");

            }


        }).catch(function (err) {


            logger.debug("DVP-ClusterConfiguration.GetProfiles PGSQL SipProfile NotFound", err);


            var instance = msg.FormatMessage(err, "Get Profiles failed", true, undefined);
            res.write(instance);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function DeleteProfileByID(id, req, res) {


    logger.debug("DVP-ClusterConfiguration.DeleteProfileByID HTTP");



    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.SipNetworkProfile.find({where: [{id: parseInt(id)}, {CompanyId: company}, {TenantId: tenant}]}).then(function (profile) {


            logger.debug("DVP-ClusterConfiguration.DeleteProfileByID PGSQL SipProfile %s Found", id);


            try {


                if (profile) {

                    profile.destroy().then(function (obj) {

                        redisCacheHandler.removeSipProfileFromCompanyObj(id, tenant, company);

                        var instance = msg.FormatMessage(undefined, "Delete Profile succeed", true, obj);
                        res.write(instance);
                        res.end();


                    }).catch(function (err) {

                        var instance = msg.FormatMessage(err, "Delete Profile", false, undefined);
                        res.write(instance);
                        res.end();


                    });


                }
                else {

                    var instance = msg.FormatMessage(undefined, "Delete Profile, No Profile found", false, undefined);
                    res.write(instance);
                    res.end();
                }


            } catch (exp) {

                //res.write("");

            }


        }).catch(function (err) {


            logger.debug("DVP-ClusterConfiguration.DeleteProfileByID PGSQL SipProfile %s NotFound", id, err);


            var instance = msg.FormatMessage(err, "Delete Profile ByID failed", false, undefined);
            res.write(instance);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function UpdateProfileByID(id, req, res) {


    logger.debug("DVP-ClusterConfiguration.UpdateProfileByID HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.SipNetworkProfile.find({where: [{id: parseInt(id)},{CompanyId: company}, {TenantId: tenant}]}).then(function (profile) {


            logger.debug("DVP-ClusterConfiguration.UpdateProfileByID PGSQL SipProfile %s Found", id);


            try {


                if (profile) {

                    var status = false;

                    if (req.body) {


                        logger.error("DVP-ClusterConfiguration.UpdateProfileByID Object Validated");


                        var userData = req.body;


                        dbmodel.IPAddress.find({where: [{IP: userData.InternalIp}, {CompanyId: company}, {TenantId: tenant}]}).then(function (ipAddress) {

                            if (ipAddress && ipAddress.IsAllocated) {

                                profile.updateAttributes({
                                    ProfileName: userData.ProfileName,
                                    MainIp: userData.MainIp,
                                    InternalIp: userData.InternalIp,
                                    InternalRtpIp: userData.InternalRtpIp,
                                    ExternalIp: userData.ExternalIp,
                                    ExternalRtpIp: userData.ExternalRtpIp,
                                    Port: userData.Port,
                                    ObjClass: userData.ObjClass,
                                    ObjType: userData.ObjType,
                                    ObjCategory: userData.ObjCategory
                                }).then(function (obj) {
                                    try {

                                        redisCacheHandler.addSipProfileToCompanyObj(obj, tenant, company);

                                        logger.error("DVP-ClusterConfiguration.UpdateProfileByID success");
                                        var instance = msg.FormatMessage(undefined, "Update SipProfile done", true, obj);
                                        res.write(instance);
                                        res.end();
                                    }
                                    catch (ex) {
                                        logger.error("DVP-ClusterConfiguration.UpdateProfileByID Object Validation failed");
                                        var instance = msg.FormatMessage(undefined, "Update SipProfile failed", false, undefined);
                                        res.write(instance);
                                        res.end();
                                    }

                                }).catch(function (err) {


                                    logger.error("DVP-ClusterConfiguration.UpdateProfileByID update error");
                                    var instance = msg.FormatMessage(err, "Update SipProfile failed", false, undefined);
                                    res.write(instance);
                                    res.end();

                                });


                            } else {

                                logger.error("DVP-ClusterConfiguration.UpdateProfileByID No IP found");
                                var instance = msg.FormatMessage(undefined, "Update SipProfile failed, no ip found", false, undefined);
                                res.write(instance);
                                res.end();

                            }

                        }).catch(function (err) {

                            logger.error("DVP-ClusterConfiguration.UpdateProfileByID No IP found");
                            var instance = msg.FormatMessage(err, "Update SipProfile failed, no ip found", false, undefined);
                            res.write(instance);
                            res.end();

                        });
                    }
                    else {
                        logger.error("DVP-ClusterConfiguration.UpdateProfileByID Object Validation failed");
                        var instance = msg.FormatMessage(undefined, "Update SipProfile done", status, undefined);
                        res.write(instance);
                        res.end();

                    }

                }
                else {

                    var instance = msg.FormatMessage(undefined, "Delete Profile, No Profile found", false, undefined);
                    res.write(instance);
                    res.end();
                }


            } catch (exp) {

                //res.write("");

            }


        }).catch(function (err) {


            logger.debug("DVP-ClusterConfiguration.DeleteProfileByID PGSQL SipProfile %s NotFound", id, err);


            var instance = msg.FormatMessage(err, "Delete Profile ByID failed", false, undefined);
            res.write(instance);
            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function AssignSipProfileToCallServer(req, res, profileid, callserverID) {


    var status = false;

    logger.debug("DVP-ClusterConfiguration.AssignSipProfileToCallServer HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        dbmodel.CallServer.find({where: [{id: callserverID}, {Activate: true}, {CompanyId: company}, {TenantId: tenant}]}).then(function (csInstance) {

            if (csInstance) {


                try {


                    dbmodel.SipNetworkProfile.find({where: [{id: profileid}, {CompanyId: company}, {TenantId: tenant}]}).then(function (profRec) {
                        if (csInstance) {

                            csInstance.addSipNetworkProfile(profRec).then(function (result) {

                                redisCacheHandler.addSipProfileToCompanyObj(result, tenant, company);

                                status = true;
                                logger.debug("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d ", profileid, callserverID);
                                redisClient.publish("CSCOMMAND:" + csInstance.Code + ":profile", profileid, redis.print);
                                var instance = msg.FormatMessage(undefined, "Assign SipProfile To CallServer", status, undefined);
                                res.write(instance);
                                res.end();


                            }).catch(function (ex) {

                                logger.error("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d failed", profileid, callserverID, err);
                                var instance = msg.FormatMessage(ex, "Assign SipProfile To CallServer", status, undefined);
                                res.write(instance);
                                res.end();


                            });
                        }
                        else {
                            logger.error("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d failed", profileid, callserverID, err);
                            var instance = msg.FormatMessage(err, "Assign SipProfile To CallServer", status, undefined);
                            res.write(instance);
                            res.end();
                        }

                    }).catch(function (ex) {

                        logger.error("DVP-ClusterConfiguration.AssignSipProfileToCallServer PGSQL SipProfile %d to CallServer %d failed", profileid, callserverID, err);
                        var instance = msg.FormatMessage(ex, "Assign SipProfile To CallServer", status, undefined);
                        res.write(instance);
                        res.end();

                    });


                } catch (exp) {

                    var instance = msg.FormatMessage(exp, "Assign SipProfile To CallServer", status, undefined);
                    res.write(instance);
                    res.end();

                }

            } else {

                var instance = msg.FormatMessage(err, "Assign SipProfile To CallServer", status, undefined);
                res.write(instance);
                res.end();
            }


        }).catch(function (err) {

            var instance = msg.FormatMessage(err, "Assign SipProfile To CallServer", status, undefined);
            res.write(instance);
            res.end();


        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function AssignSipProfiletoEndUser(req, res, profileid, enduserID) {


    logger.debug("DVP-ClusterConfiguration.AssignSipProfiletoEndUser HTTP");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;




        var status = false;

        dbmodel.CloudEndUser.find({where: [{id: enduserID},{CompanyId: company}, {TenantId: tenant}]}).then(function (enduser) {

            if (enduser) {


                try {

                    dbmodel.SipNetworkProfile.find({where: [{id: profileid}, {CompanyId: company}, {TenantId: tenant}]}).then(function (nw) {
                        if (nw) {

                            enduser.setSipNetworkProfile(nw).then(function (result) {

                                status = true;
                                logger.debug("DVP-ClusterConfiguration.AssignSipProfiletoEndUser PGSQL SipProfile %d to EndUser %d", profileid, enduserID, err);
                                var instance = msg.FormatMessage(undefined, "Assign SipProfile to EndUser", status, result);
                                res.write(instance);
                                res.end();


                            }).catch(function (ex) {

                                logger.error("DVP-ClusterConfiguration.AssignSipProfiletoEndUser PGSQL SipProfile %d to EndUser %d failed", profileid, enduserID);
                                var instance = msg.FormatMessage(err, "Assign SipProfile to EndUser", status, undefined);
                                res.write(instance);
                                res.end();


                            })

                        }
                        else {
                            callback(undefined, undefined, false);
                        }
                    }).catch(function (ex) {

                        var instance = msg.FormatMessage(ex, "Assign SipProfile to EndUser", status, undefined);
                        res.write(instance);
                        res.end();


                    });


                } catch (exp) {

                    var instance = msg.FormatMessage(exp, "Assign SipProfile to EndUser", status, undefined);
                    res.write(instance);
                    res.end();

                }

            } else {

                var instance = msg.FormatMessage(err, "Assign SipProfile to EndUser", status, undefined);
                res.write(instance);
                res.end();
            }


        }).catch(function (err) {

            var instance = msg.FormatMessage(err, "Assign SipProfile to EndUser", status, undefined);
            res.write(instance);
            res.end();

        });


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }


}

function GetIPAddresses(res, req) {


    logger.error("DVP-ClusterConfiguration.GetIPAddresses");


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;

        dbmodel.IPAddress.findAll({where:[{CompanyId: company}, {TenantId: tenant}]}).then(function (ipAddresses) {


            logger.error("DVP-ClusterConfiguration.GetIPAddresses IP found");
            var instance = msg.FormatMessage(undefined, "IPAddress found", true, ipAddresses);
            res.write(instance);
            res.end();


        }).catch(function (err) {

            logger.error("DVP-ClusterConfiguration.GetIPAddresses No IPs found");
            var instance = msg.FormatMessage(err, "Update SipProfile failed, no IPs found", false, undefined);
            res.write(instance);
            res.end();

        });

    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }




}

function GetCallServersForCompany(req, res) {


    var company;
    var tenant;

    if(req&& req.user && req.user.company && req.user.tenant) {

        company =req.user.company;
        tenant = req.user.tenant;


        var tempEmptyArr = [];
        try {







                dbmodel.CloudEndUser
                    .find({where: [{CompanyId: company}, {TenantId: tenant}]})
                    .then(function (endUser) {
                        if (endUser && endUser.SIPConnectivityProvision) {
                            logger.debug('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get cloud end user query success');
                            var provisionMechanism = endUser.SIPConnectivityProvision;

                            switch (provisionMechanism) {
                                case 1:
                                {
                                    //find call server
                                    dbmodel.CallServer
                                        .find({where: [{CompanyId: company}, {TenantId: tenant}]})
                                        .then(function (cs) {
                                            if (cs) {
                                                logger.debug('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get call server query success');
                                                //call server found
                                                tempEmptyArr.push(cs);
                                                var respJson = msg.FormatMessage(undefined, "Call Server Found", true, tempEmptyArr);
                                                res.write(respJson);
                                                res.end();

                                            }
                                            else {
                                                logger.debug('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get call server query success');

                                                var respJson = msg.FormatMessage(undefined, "Call Server Not Found", true, tempEmptyArr);
                                                res.write(respJson);
                                                res.end();
                                            }

                                        }).catch(function (err) {
                                            logger.error('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get call server query failed', err);

                                            var respJson = msg.FormatMessage(err, "Error occurred", false, tempEmptyArr);
                                            res.write(respJson);
                                            res.end();
                                        });
                                }
                                    break;
                                case 2:
                                {
                                    //find call server that matches profile
                                    dbmodel.SipNetworkProfile
                                        .find({
                                            where: [{CompanyId: company}, {TenantId: tenant}, {ObjType: "INTERNAL"}],
                                            include: [{model: dbmodel.CallServer, as: "CallServer"}]
                                        })
                                        .then(function (res) {
                                            if (res) {
                                                logger.debug('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get sip profile query success');
                                                if (res.CallServer) {
                                                    tempEmptyArr.push(res.CallServer);
                                                    var respJson = msg.FormatMessage(undefined, "Call Server Found", true, tempEmptyArr);
                                                    res.write(respJson);
                                                    res.end();
                                                }
                                                else {
                                                    var respJson = msg.FormatMessage(new Error('call server not connected to sip profile'), "Call Server Not Found", false, tempEmptyArr);
                                                    res.write(respJson);
                                                    res.end();
                                                }
                                            }
                                            else {
                                                var respJson = msg.FormatMessage(new Error('Cannot find a sip network profile'), "Call Server Not Found", false, tempEmptyArr);
                                                res.write(respJson);
                                                res.end();
                                            }


                                        }).catch(function (err) {
                                            logger.error('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get sip profile query failed', err);
                                            var respJson = msg.FormatMessage(err, "Error occurred", false, tempEmptyArr);
                                            res.write(respJson);
                                            res.end();
                                        });
                                    break;
                                }
                                case 3:
                                {
                                    //find cloud code that belongs to cloud end user

                                    if (endUser.ClusterId) {
                                        var clusId = endUser.ClusterId;

                                        dbmodel.Cloud
                                            .find({
                                                where: [{id: clusId}],
                                                include: [{model: dbmodel.CallServer, as: "CallServer"}]
                                            })
                                            .then(function (clusterInfo) {
                                                if (clusterInfo) {
                                                    logger.debug('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get cloud query success');

                                                    var respJson = msg.FormatMessage(undefined, "Call Server Found", true, clusterInfo.CallServer);
                                                    res.write(respJson);
                                                    res.end();
                                                }
                                                else {
                                                    logger.debug('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get cloud query success');
                                                    var respJson = msg.FormatMessage(undefined, "Call Server Found", true, tempEmptyArr);
                                                    res.write(respJson);
                                                    res.end();
                                                }

                                            }).catch(function (err) {
                                                logger.error('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get cloud query failed', err);
                                                var respJson = msg.FormatMessage(err, "Error occurred", false, tempEmptyArr);
                                                res.write(respJson);
                                                res.end();
                                            });

                                    }
                                    else {
                                        var respJson = msg.FormatMessage(new Error('Cluster Id not set'), "Call Servers Not Found", false, tempEmptyArr);
                                        res.write(respJson);
                                        res.end();
                                    }
                                    break;

                                }
                                default:
                                {

                                    var respJson = msg.FormatMessage(new Error('Invalid provision mechanism'), "Call Servers Not Found", false, tempEmptyArr);
                                    res.write(respJson);
                                    res.end();
                                    break;
                                }
                            }
                        }
                        else {
                            logger.debug('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get cloud end user query success');

                            var respJson = msg.FormatMessage(new Error('Cloud Enduser not found'), "Call Servers Not Found", false, tempEmptyArr);
                            res.write(respJson);
                            res.end();
                        }

                    }).catch(function (err) {
                        logger.error('[DVP-DynamicConfigurationGenerator.GetCloudForIncomingRequest] PGSQL Get cloud end user query failed', err);
                        var respJson = msg.FormatMessage(err, "Error occurred", false, tempEmptyArr);
                        res.write(respJson);
                        res.end();
                    });



        }
        catch (ex) {
            var respJson = msg.FormatMessage(ex, "Error occurred", false, tempEmptyArr);
            res.write(respJson);
            res.end();

        }


    }else{

        res.write(msg.FormatMessage(err, "Token error, no company data found", false, undefined));
        res.end();

    }



}

function AddNumberToBlacklist(req, res)
{
    try
    {
        var reqBody = req.body;

        logger.debug('[DVP-ClusterConfiguration.AddNumberToBlacklist] - HTTP Request Received - Req Body : ', reqBody);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        if(reqBody)
        {
            var blacklist = dbmodel.NumberBlacklist.build({PhoneNumber: reqBody.PhoneNumber, CompanyId: companyId, TenantId: tenantId});

            blacklist
                .save()
                .then(function (saveRes)
                {
                    var jsonString = msg.FormatMessage(undefined, "Add number to blacklist success", true, true);
                    logger.debug('[DVP-ClusterConfiguration.AddNumberToBlacklist] - API RESPONSE : %s', jsonString);
                    res.end(jsonString);

                }).catch(function(err)
                {
                    var jsonString = msg.FormatMessage(err, "Add number to blacklist failed", false, false);
                    logger.debug('[DVP-ClusterConfiguration.AddNumberToBlacklist] - API RESPONSE : %s', jsonString);
                    res.end(jsonString);
                });
        }
        else
        {
            var jsonString = msg.FormatMessage(new Error('Empty request body'), "Empty request body", false, false);
            logger.debug('[DVP-ClusterConfiguration.AddNumberToBlacklist] - API RESPONSE : %s', jsonString);
            res.end(jsonString);

        }


    }
    catch(ex)
    {
        logger.error('[DVP-ClusterConfiguration.AddNumberToBlacklist] - Exception Occurred', ex);
        var jsonString = msg.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-ClusterConfiguration.AddNumberToBlacklist] - API RESPONSE : %s', jsonString);
        res.end(jsonString);

    }

}

function RemoveNumberFromBlacklist(req, res)
{
    try
    {
        var numId = req.params.id;

        logger.debug('[DVP-ClusterConfiguration.RemoveNumberFromBlacklist] - HTTP Request Received - Req Params Id : ', numId);

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        dbmodel.NumberBlacklist.find({where: [{id: numId},{CompanyId: companyId},{TenantId: tenantId}]}).then(function (blackListNum)
        {
            if(blackListNum)
            {
                blackListNum.destroy().then(function (result)
                {
                    var jsonString = msg.FormatMessage(undefined, "Remove number from blacklist success", true, true);
                    logger.debug('[DVP-ClusterConfiguration.RemoveNumberFromBlacklist] - API RESPONSE : %s', jsonString);
                    res.end(jsonString);

                }).catch(function(err)
                {
                    var jsonString = msg.FormatMessage(err, "Remove number from blacklist failed", false, false);
                    logger.debug('[DVP-ClusterConfiguration.RemoveNumberFromBlacklist] - API RESPONSE : %s', jsonString);
                    res.end(jsonString);
                });
            }
            else
            {

                var jsonString = msg.FormatMessage(new Error('Cannot find a number with given id'), "Remove number from blacklist failed", false, false);
                logger.error('[DVP-ClusterConfiguration.RemoveNumberFromBlacklist] - Cannot find a number with given id');
                res.end(jsonString);
            }



        }).catch(function(err)
        {
            logger.error('[DVP-ClusterConfiguration.RemoveNumberFromBlacklist] - Error occurred', err);
            var jsonString = msg.FormatMessage(err, "Remove number from blacklist failed", false, false);
            res.end(jsonString);
        })

    }
    catch(ex)
    {
        var jsonString = msg.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-ClusterConfiguration.RemoveNumberFromBlacklist] - API RESPONSE : %s', jsonString);
        res.end(jsonString);
    }

}

function GetNumbersInBlacklist(req, res)
{
    try
    {
        logger.debug('[DVP-ClusterConfiguration.GetNumbersInBlacklist] - HTTP Request Received');

        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        dbmodel.NumberBlacklist.findAll({where: [{CompanyId: companyId},{TenantId: tenantId}]}).then(function (blackListNumList)
        {
            var jsonString = msg.FormatMessage(undefined, "Get numbers from blacklist success", true, blackListNumList);
            logger.debug('[DVP-ClusterConfiguration.GetNumbersInBlacklist] - API RESPONSE : %s', jsonString);
            res.end(jsonString);

        }).catch(function(err)
        {
            logger.error('[DVP-ClusterConfiguration.GetNumbersInBlacklist] - Error occurred', err);
            var jsonString = msg.FormatMessage(err, "Get numbers from blacklist failed", false, false);
            res.end(jsonString);
        })

    }
    catch(ex)
    {
        var jsonString = msg.FormatMessage(ex, "Exception occurred", false, false);
        logger.debug('[DVP-ClusterConfiguration.GetNumbersInBlacklist] - API RESPONSE : %s', jsonString);
        res.end(jsonString);
    }

}

function AddAuditTrail(res, req)
{
    try
    {
        logger.debug('[DVP-ClusterConfiguration.AddAuditTrail] - HTTP Request Received');


        var companyId = req.user.company;
        var tenantId = req.user.tenant;
        var iss = req.user.iss;

        var auditTrails = req.body;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        auditTrailHandler.CreateAuditTrails(tenantId,companyId,iss,auditTrails, function(err, auditAddRes)
        {
            if(err)
            {
                var jsonString = msg.FormatMessage(err, "Exception occurred", false, null);
                logger.debug('[DVP-ClusterConfiguration.AddAuditTrail] - API RESPONSE : %s', jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = msg.FormatMessage(null, "Success", true, auditAddRes);
                logger.debug('[DVP-ClusterConfiguration.AddAuditTrail] - API RESPONSE : %s', jsonString);
                res.end(jsonString);
            }

        })

    }
    catch(ex)
    {
        var jsonString = msg.FormatMessage(ex, "Exception occurred", false, null);
        logger.debug('[DVP-ClusterConfiguration.AddAuditTrail] - API RESPONSE : %s', jsonString);
        res.end(jsonString);
    }

}

function GetAuditTrailsPaging(res, req)
{
    var emptyArr = [];
    try
    {
        logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - HTTP Request Received');


        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        var application = req.query.application;
        var property = req.query.property;
        var author = req.query.author;
        var starttime = req.query.startTime;
        var endtime = req.query.endTime;
        var pageSize = req.query.pageSize;
        var pageNo = req.query.pageNo;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        auditTrailHandler.GetAllAuditTrailsPaging(tenantId,companyId, application, property, author, starttime, endtime, pageSize, pageNo, function(err, auditRes)
        {
            if(err)
            {
                var jsonString = msg.FormatMessage(err, "Exception occurred", false, emptyArr);
                logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - API RESPONSE : %s', jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = msg.FormatMessage(null, "Success", true, auditRes);
                logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - API RESPONSE : %s', jsonString);
                res.end(jsonString);
            }

        })

    }
    catch(ex)
    {
        var jsonString = msg.FormatMessage(ex, "Exception occurred", false, emptyArr);
        logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - API RESPONSE : %s', jsonString);
        res.end(jsonString);
    }

}

function GetAuditTrailsCount(res, req)
{
    try
    {
        logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - HTTP Request Received');


        var companyId = req.user.company;
        var tenantId = req.user.tenant;

        var application = req.query.application;
        var property = req.query.property;
        var starttime = req.query.startTime;
        var endtime = req.query.endTime;
        var author = req.query.author;

        if (!companyId || !tenantId)
        {
            throw new Error("Invalid company or tenant");
        }

        auditTrailHandler.GetAllAuditTrailsCount(tenantId,companyId, application, property, author, starttime, endtime, function(err, auditCount)
        {
            if(err)
            {
                var jsonString = msg.FormatMessage(err, "Exception occurred", false, auditCount);
                logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - API RESPONSE : %s', jsonString);
                res.end(jsonString);
            }
            else
            {
                var jsonString = msg.FormatMessage(null, "Success", true, auditCount);
                logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - API RESPONSE : %s', jsonString);
                res.end(jsonString);
            }

        })

    }
    catch(ex)
    {
        var jsonString = msg.FormatMessage(ex, "Exception occurred", false, 0);
        logger.debug('[DVP-ClusterConfiguration.GetAuditTrailsPaging] - API RESPONSE : %s', jsonString);
        res.end(jsonString);
    }

}



module.exports.CreateCluster = CreateCluster;
module.exports.AddLoadBalancer = AddLoadBalancer;
module.exports.GetClusterByID = GetClusterByID;
module.exports.GetClusters = GetClusters;
module.exports.ActivateCloud = ActivateCloud;
module.exports.CreateCallServer = CreateCallServer;
module.exports.UniqueCode = UniqueCode;
module.exports.ActivateCallServer = ActivateCallServer;
module.exports.GetCallServerByID = GetCallServerByID;
module.exports.AddCallServerToCloud = AddCallServerToCloud;
module.exports.SetParentCloud = SetParentCloud;
module.exports.CreateTelcoNetwork = CreateTelcoNetwork;
module.exports.SetTelcoNetworkToCloud = SetTelcoNetworkToCloud;
module.exports.CreateEndUserNetwork = CreateEndUserNetwork;
module.exports.SetTelcoNetworkToUSer = SetTelcoNetworkToUSer;
module.exports.GetNetworks = GetNetworks;
module.exports.GetNetwork = GetNetwork;
module.exports.DeleteNetwork = DeleteNetwork;
module.exports.CreateEndUser = CreateEndUser;
module.exports.GetEndUsers = GetEndUsers;
module.exports.CreateSipProfile = CreateSipProfile;
module.exports.AssignSipProfileToCallServer = AssignSipProfileToCallServer;
module.exports.AssignSipProfiletoEndUser = AssignSipProfiletoEndUser;
module.exports.StoreIPAddressDetails = StoreIPAddressDetails;
module.exports.GetIPAddresses = GetIPAddresses;
module.exports.GetProfileByID = GetProfileByID;
module.exports.GetCallServers = GetCallServers;
module.exports.GetProfiles = GetProfiles;
module.exports.GetNetworkByClusterID = GetNetworkByClusterID;
module.exports.GetEndUsersByClusterID = GetEndUsersByClusterID;
module.exports.EditCluster = EditCluster;
module.exports.EditCallServer = EditCallServer;
module.exports.RemoveCallServerFromCloud = RemoveCallServerFromCloud;
module.exports.RemoveTelcoNetworkFromCloud = RemoveTelcoNetworkFromCloud;
module.exports.RemoveTelcoNetworkFromUser = RemoveTelcoNetworkFromUser;
module.exports.EditNetwork = EditNetwork;
module.exports.GetActiveCallserversByClusterID = GetActiveCallserversByClusterID;
module.exports.GetActiveCallserversByClusterID = GetActiveCallserversByClusterID;
module.exports.DeleteProfileByID = DeleteProfileByID;
module.exports.DeleteIPAddresses = DeleteIPAddresses;
module.exports.UpdateProfileByID = UpdateProfileByID;
module.exports.UpdateEndUser = UpdateEndUser;
module.exports.DeleteEndUser = DeleteEndUser;
module.exports.GetEndUser = GetEndUser;
module.exports.GetNetworkByClusterID = GetNetworkByClusterID;
module.exports.GetEndUsersByClusterID = GetEndUsersByClusterID;
module.exports.GetCallServersForCompany = GetCallServersForCompany;
module.exports.AddNumberToBlacklist = AddNumberToBlacklist;
module.exports.RemoveNumberFromBlacklist = RemoveNumberFromBlacklist;
module.exports.GetNumbersInBlacklist = GetNumbersInBlacklist;
module.exports.GetAuditTrailsPaging = GetAuditTrailsPaging;
module.exports.AddAuditTrail = AddAuditTrail;
module.exports.GetAuditTrailsCount = GetAuditTrailsCount;
module.exports.CreateEndUserTenant = CreateEndUserTenant;
module.exports.UpdateEndUserTenant = UpdateEndUserTenant;
module.exports.GetEndUsersTenant = GetEndUsersTenant;
module.exports.CreateDefaultEndUser = CreateDefaultEndUser;
