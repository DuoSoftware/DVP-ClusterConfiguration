module.exports = function(sequelize, DataTypes) {
    var Conference = sequelize.define('CSDB_Conference', {
            ConferenceName: {type:DataTypes.STRING, primaryKey:true},
            Description: DataTypes.STRING,
            CompanyId: DataTypes.INTEGER,
            TenantId: DataTypes.INTEGER,
            ObjClass: DataTypes.STRING,
            ObjType: DataTypes.STRING,
            ObjCategory: DataTypes.STRING
        }
    );


    return Conference;
};