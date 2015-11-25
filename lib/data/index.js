'use strict'

module.exports =
{
  "name": "data",
  "SchemaCache": require('./schemaCache.js'),
  "DbAdapter": require('./dbAdapter.js'),
  "MongoDBConnections": require('./mongoDBConnections.js'),
  "MongoDBAdapter": require('./mongoDBAdapter.js'),
  "MySQLDBConnections": require('./mysqlDBConnections.js')
}
