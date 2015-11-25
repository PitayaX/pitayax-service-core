'use strict'

const Data = require('../../').data

const conns = new Data.MySQLDBConnections()
const connectionString = 'mysql://elliemae_ps:elliemae-sh-13@10.10.73.209/db-ps?pool=true'
const cs = conns.parseConnectionString(connectionString, {"typeCast": true, "stringifyObjects": false})
//console.log(cs)

conns.create('test1', connectionString, {})

const conn = conns.get('test1')
conn.execute('SELECT col1 FROM table1')
  .then( data => console.log(conn.repackageData(data)) )
  .catch( err => { console.log(err) })

conn.execute('select max(col1) + 1 as a from table1')
 .then( data => {
   //return conn.execute('insert into table1 (`col1`, `col2`, `col3`) values (' + data[0].a + ', "t1", "t2");')
   return data
 })
 .then( data => console.log(data) )
 .catch( err => console.log(err) )
 .finally( () => conn.close() )
