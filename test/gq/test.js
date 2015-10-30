'use strict'

let path = require('path')
let fs = require('fs')
let aq = require('../../').aq
let gq = require('../../').gq
let data = require('../../').data
let fake = require('../../').fake

let Parser = gq.Parser
let Engine = gq.Engine

let that = this
let port = 1388
let fakedHTTP = new fake.http(port)

let script = undefined
let args = []

let connections = new data.MongoDBConnections()
connections.create('test1', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test')
connections.create('test2', 'mongodb://usrpx:password@10.10.73.207:27077/pitayax-test')

connections.on('error', (err, conn) => {
    if (err) {
        console.log(`Get error from ${conn.Name}: ${err.message} (code: ${err.code})`)
    }
})

let start = () => fakedHTTP.start()
let done = (message) => {

    if (message) {
        console.log(JSON.stringify(message, null, 2))
        setTimeout(() => connections.close('test1'), 1000)
    }

    fakedHTTP.stop()
}

//append schemas
['../data/schemas/blog.json', '../data/schemas/northwind.json']
    .map(file => JSON.parse(fs.readFileSync(path.join(__dirname, file))))
    .forEach(schema => connections.appendSchema(schema))

let mongoAdapter = new data.MongoDBAdapter(connections)

let createEngine = (script) => {

        let engine = new Engine(script)

        engine.setDataAdapter('mongo', mongoAdapter)
        engine.setContextItem('conf', {"port": port})

        return engine
}

for(let i = 0; i < process.argv.length; i++) {
    if (i == 2) script = process.argv[i]
    if (i > 2) args.push(process.argv[i])
}

if (script) {

    let scriptFile = path.join(__dirname, script)
    if (fs.existsSync(scriptFile)){
        Parser.parse(scriptFile)
            .then(script => {
                start()
                return createEngine(script)
            })
            .then(engine => engine.execute(args))
            .then(data => done(data))
            .catch(err => done(`exec script failed, details: ${err.message}`))
    }
    else {
        console.log(`Can't find script file: "${scriptFile}"`)
    }
}
else {
    console.log('Can\'t find script argument.')
}
