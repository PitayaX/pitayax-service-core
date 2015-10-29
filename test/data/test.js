'use strict';

let fs = require('fs');
let path = require('path');
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
    //console.log(`connection ${conn.Name} was opened`);

    switch(conn.Name) {
        case 'test1':
            setTimeout(() => {
                //console.log('start to close connection test1');
                connections.close('test1');
            }, 2000);
            break;
        case 'test3':
            console.log('ready for query data.');
            break;
        default:
            break;
    }
})

connections.on('close', (conn) => {
    //console.log(`connection ${conn.Name} was closed`);
})

connections.on('disconnected', (conn) => {
    //console.log(`connection ${conn.Name} was disconnected`);
})

connections.on('error', (err, conn) => {

    if (err) {
        console.log(`Get error from ${conn.Name}: ${err.message} (code: ${err.code})`);

        if (err.code === undefined) {
            //conn.Connection.disconnect();
            console.log(`Can't create connection for ${conn.Name}.`);
            connections.remove(conn.Name);
        }
        else connections.close(conn.Name);
    }
});

//conn1, 2 and 3 has same connection string, so they will share one connection
let conn1 = connections.create('test1', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test');
let conn2 = connections.create('test2', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test');
let conn3 = connections.create('test3', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test');
//let conn4 = connections.create('test4', 'mongodb://usrpx:password22@10.10.73.207:27077/pitayax-test');
//let conn5 = connections.create('test5', 'mongodb://usrpx:password@10.10.73.207:27078/pitayax-test');

console.log(`names: ${connections.Names}`);


['/schemas/blog.json', '/schemas/northwind.json']
    .map(file => path.join(__dirname, file))
    .map(filename => JSON.parse(fs.readFileSync(filename)))
    .forEach(schemas => connections.appendSchema(schemas));

let keys = [];
connections.Schemas.forEach((v, k) => keys.push(k));

let dbAdapter = new data.MongoDBAdapter(connections);
console.log('created adapter of mongo database');

let flags = [false, true, true]

//test retrieve mode
if (flags[0]) {

    setTimeout(()=> {

        dbAdapter.retrieve('post', {"title": "title"}, {"method": "findOne"})
            .then(data => {
                //console.log(' --- find one: ' + JSON.stringify(data, null, 2));
                return dbAdapter.retrieve('post', {}, {"method": "find"});
            })
            .then(data => {
                //console.log(' --- list: ' + JSON.stringify(data, null, 2));
                return dbAdapter.retrieve('post', {}, {"method": "count"});
            })
            .then(data => {
                console.log('--- count:' + JSON.stringify(data, null, 2));
            })
            .then(data => console.log('query data finished'))
            .catch(err => console.log(`err: ${err.message}`));
    }, 500)
}

if (flags[1]) {
    setTimeout(() => {
        console.log('ready for create!')
        dbAdapter.retrieve('post', {}, {"method": "count"})
            .then( data => {
                console.log('--- count: ' + JSON.stringify(data, null, 2));
                return dbAdapter.create('post', {"title": "test title"})
            })
            .then( data => {
                let id = data._id;
                console.log('created, _id: ' + id);

                return dbAdapter.retrieve('post', {}, {"method": "count"})
                    .then( data => {
                        console.log('--- count: ' + JSON.stringify(data, null, 2));

                        return aq.parallel([
                                dbAdapter.update('post', {"_id": id}, {"title": "changed title"}),
                                dbAdapter.delete('post', {"_id": id})
                            ]);
                    });
            })
            .then( data => {
                console.log(`result: ${JSON.stringify(data, null, 2)}`);
                return dbAdapter.retrieve('post', {}, {"method": "count"})
            })
            .then( data => {
                console.log('--- count: ' + JSON.stringify(data, null, 2));
            })
            .catch(err => console.log(`err: ${err.message}`));

    }, 100);
}

if(flags[2]) {
    setTimeout(() => {
        dbAdapter.create('category', {"Description": "Test", "CategoryName": "Name"})
            .then(data => {
                console.log('create category.');
                console.log('data: ' + JSON.stringify(data, null, 2));
            })
            .catch(err => console.log(`err: ${err.message}`));
    }, 2000)
}
