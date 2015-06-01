module.exports = function(sequelize, DataTypes) {
    var PBXUserTemplate = sequelize.define('CSDB_PBXUserTemplate', {
            UserStatus: DataTypes.STRING, //DND, CALL_DIVERT, AVAILABLE
            CallDivertNumber: DataTypes.STRING,
            AdvancedRouteMethod: DataTypes.STRING, //FORWARD, FOLLOW_ME
            FollowMeMechanism: DataTypes.STRING, //SEQUENTIAL, PARALLEL
            CompanyId: DataTypes.INTEGER,
            TenantId: DataTypes.INTEGER,
            ObjClass: DataTypes.STRING,
            ObjType: DataTypes.STRING,
            ObjCategory: DataTypes.STRING
        }
    );

    return PBXUserTemplate;
};