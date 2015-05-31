module.exports = {
    "DB": {
        "Type":"SYS_DB_TYPE",
        "User":"SYS_DB_USER",
        "Password":"SYS_DB_PASSWORD",
        "Port":"SYS_SQL_PORT",
        "Host":"SYS_DB_HOST",
        "Database":"SYS_DB_USER"
    },


    "Redis":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT"

    },

    "Host":
    {
        "vdomain": "VIRTUAL_HOST",
        "domain": "HOST_NAME",
        "port": "HOST_PORT",
        "version": "HOST_VERSION"
    },

    "LBServer" : {

        "ip": "LB_IP",
        "port": "LB_PORT"

    }
};

//NODE_CONFIG_DIR