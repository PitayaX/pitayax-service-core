'use strict'

module.exports =
{
  "name": "data",
  "MongoDBConnections": require('./mongoDBConnections.js'),
  "DbAdapter": require('./dbAdapter.js'),
  "MongoDBAdapter": require('./mongoDBAdapter.js'),
  "SchemaCache": require('./schemaCache.js')
}
