module.exports = function(sequelize, DataTypes) {
    var CallRule = sequelize.define('CSDB_CallRule', {
            CallRuleDescription: DataTypes.STRING,
            ObjClass: DataTypes.STRING,
            ObjType: DataTypes.STRING, //Inbound ,Outbound
            ObjCategory: DataTypes.STRING, //IVR, FAX, URL, Gateway
            Enable: DataTypes.BOOLEAN,
            CompanyId: DataTypes.INTEGER,
            TenantId: DataTypes.INTEGER,
            DNIS: DataTypes.STRING,
            ANI: DataTypes.STRING,
            DNISRegEx: DataTypes.STRING,
            ANIRegEx: DataTypes.STRING,
            RegExPattern: DataTypes.STRING, //StartWith, ExactMatch, Custom
            ANIRegExPattern: DataTypes.STRING,
            TrunkId: DataTypes.INTEGER,
            TrunkNumber: DataTypes.STRING,
            ExtraData: DataTypes.STRING,
            Priority: DataTypes.INTEGER,
            ContextRegEx: DataTypes.STRING,
            Context: DataTypes.STRING

        }
    );

    return CallRule;
};