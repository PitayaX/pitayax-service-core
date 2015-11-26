'use strict'

const Data = require('../../').data

const mysqlConns = new Data.MySQLDBConnections()
const connectionString = 'mysql://elliemae_ps:elliemae-sh-13@10.10.73.209/db-ps?pool=true'
const cs = mysqlConns.parseConnectionString(connectionString, {"typeCast": true, "stringifyObjects": false})
//console.log(cs)

mysqlConns.create('test1', connectionString, {})

const mysqlConn = mysqlConns.get('test1')

mysqlConn.createConnection()
  .then(conn => mysqlConn.query(conn, 'SELECT col1 FROM table1'))
  .then( data => console.log('a:' + JSON.stringify(mysqlConn.repackageData(data))))
  .finally(() => mysqlConn.end())


mysqlConn.execute('SELECT col1 FROM table1')
  .then( data => console.log('b:' + JSON.stringify(mysqlConn.repackageData(data))))
  .catch( err => { console.log(err) })

mysqlConn.execute('select max(col1) + 1 as a from table1')
 .then( data => console.log(data) )
 .catch( err => console.log(err) )
 .finally( () => mysqlConn.end() )
