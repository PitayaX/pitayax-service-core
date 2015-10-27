'use strict';

let aq = require('../../').aq;
let data = require('../../').data;


let connections = new data.MongoDBConnections();

//console.log('tested');

/*
connections.on = (event, conn) => {
    console.log(event);
}
*/

connections.on('open', (conn) => {
    console.log(conn.Connected);
    console.log(`connection ${conn.Name} was opened`);
})

connections.on('disconnected', (conn) => {
    console.log(conn.Connected);
    console.log(`connection ${conn.Name} was disconnected`);
})

let conn1 = connections.create('test1', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test');
let conn2 = connections.create('test2', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test');

console.log(conn1.Name);
console.log(conn2.Name);

connections.close('test1');
//connections.close('test1');



//conn2.Connection.close();


/*
let script = undefined;
let args = [];

for(let i = 0; i < process.argv.length; i++) {
    if (i == 2) script = process.argv[i];
    if (i > 2) args.push(process.argv[i]);
}
*/
