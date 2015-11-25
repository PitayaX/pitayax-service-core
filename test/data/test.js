'use strict'

const fs = require('fs')
const path = require('path')
const aq = require('../../').aq
const data = require('../../').data


let connections = new data.MongoDBConnections()

connections.on('open', (conn) => {
    //console.log(`connection ${conn.Name} was opened`)

    switch(conn.Name) {
        case 'test1':
            setTimeout(() => {
                //console.log('start to close connection test1')
                connections.close('test1')
            }, 2000)
            break
        case 'test3':
            console.log('ready for query data.')
            break
        default:
            break
    }
})

connections.on('close', (conn) => {
    //console.log(`connection ${conn.Name} was closed`)
})

connections.on('disconnected', (conn) => {
    //console.log(`connection ${conn.Name} was disconnected`)
})

connections.on('error', (err, conn) => {

    if (err) {
        console.log(`Get error from ${conn.Name}: ${err.message} (code: ${err.code})`)

        if (err.code === undefined) {
            //conn.Connection.disconnect()
            console.log(`Can't create connection for ${conn.Name}.`)
            connections.remove(conn.Name)
        }
        else connections.close(conn.Name)
    }
})

//conn1, 2 and 3 has same connection string, so they will share one connection
let conn1 = connections.create('test1', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test')
let conn2 = connections.create('test2', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test')
let conn3 = connections.create('test3', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test')
let conn4 = connections.create('test4', 'mongodb://usrpx:password22@10.10.73.207:27077/pitayax-test')
//let conn5 = connections.create('test5', 'mongodb://usrpx:password@10.10.73.207:27078/pitayax-test')

console.log(`names: ${connections.Names}`)


let files = ['/schemas/blog.json', '/schemas/northwind.json']

files.map( file => path.join(__dirname, file) )
    .map( file => JSON.parse(fs.readFileSync(file)) )
    .forEach( schema => connections.appendSchema(schema) )

let dbAdapter = new data.MongoDBAdapter(connections)
console.log('created adapter of mongo database')

let name = 'post'
let flags = [true, true, true, false]

//test retrieve mode
if (flags[0]) {

    setTimeout(()=> {

        //test retrieve methods findOne, find and count.
        dbAdapter.retrieve(name, {"title": "title"}, {"method": "findOne"})
            .then( data => {
                console.log('--- find one: ' + JSON.stringify(data, null, 2))
                return dbAdapter.retrieve(name, {}, {"method": "find"})
            })
            .then( data => {
                console.log('--- list1: ' + JSON.stringify(data, null, 2))
                return dbAdapter.retrieve(name, {})  //find can ignore
            })
            .then( data => {
                console.log('--- list2: ' + JSON.stringify(data, null, 2))
                return dbAdapter.retrieve(name, {}, {"method": "count"})
            })
            .then( data => {
                console.log('--- count by query: ' + JSON.stringify(data, null, 2))
            })
            .then( data => console.log('query data finished') )
            .catch( err => console.log(`err: ${err.message}`) )
    }, 100)
}

if (flags[1]) {
    setTimeout( () => {

        console.log('ready for create!')

        //get count of all objects
        dbAdapter.retrieve(name, {}, {"method": "count"})
            .then( data => {

                console.log('--- count: ' + JSON.stringify(data, null, 2))

                //create new object
                return dbAdapter.create(name, {"title": "test title"})
            })
            .then( data => {

                //get id from new object
                let id = data._id
                console.log('created, _id: ' + id)

                //get count of all objects
                return dbAdapter.retrieve(name, {}, {"method": "count"})
                    .then( data => {

                        console.log('--- count: ' + JSON.stringify(data, null, 2))

                        //test delete and update mode
                        return aq.parallel([
                                dbAdapter.update(name, {"_id": id}, {"title": "changed title"}),
                                dbAdapter.delete(name, {"_id": id})
                            ])
                    })
            })
            .then( data => {

                //output result by update and delete
                console.log(`result: ${JSON.stringify(data, null, 2)}`)

                //get count of all objects
                return dbAdapter.retrieve(name, {}, {"method": "count"})
            })
            .then( data => {
                console.log('--- count: ' + JSON.stringify(data, null, 2))
            })
            .catch( err => console.log(`err: ${err.message}`))

    }, 500)
}

if(flags[2]) {

    //create new object with increment
    setTimeout(() => {
        dbAdapter.create('category', {"Description": "Test", "CategoryName": "Name"})
            .then( data => {
                console.log('create category.')
                console.log('data: ' + JSON.stringify(data, null, 2))
            })
            .catch( err => console.log(`err: ${err.message}`))
    }, 2000)
}
