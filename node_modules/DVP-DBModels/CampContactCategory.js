/**
 * Created by Rajinda on 7/20/2015.
 */



module.exports = function (sequelize, DataTypes) {
    var CampContactCategory = sequelize.define('DB_CAMP_CampContactCategory', {
            CategoryName: DataTypes.STRING,
            TenantId: DataTypes.INTEGER,
            CompanyId: DataTypes.INTEGER,
            CategoryID: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
        }
    );
    return CampContactCategory;
};

