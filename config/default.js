module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"104.131.105.222",
    "Database":"duo"
  },


  "Redis":
  {
    "ip": "localhost",
    "port": 6379

  },




  "Host":
  {
    "resource": "cluster",
    "vdomain": "localhost",
    "domain": "localhost",
    "port": "3636",
    "version": "1.0"
  },

  "LBServer" : {

    "ip": "localhost",
    "port": "3434"

  }
};