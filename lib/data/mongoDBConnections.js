'use strict'

let mongoose = require('mongoose')
let EventEmitter = require('events').EventEmitter

const defaultOptions = {
    db: { native_parser: true },
    auth: { authdb: "admin" },
    server: { poolSize:10 }
}

class MongoDBConnection
{
    constructor(name, connectionString, connection)
    {
        this.name = name
        this.connectionString = connectionString
        this.connection = connection
        this.connected = false
    }

    get Name() { return this.name }
    get ConnectionString() { return this.connectionString }
    get Connection() { return this.connection }

    get Connected() { return this.connected }
    set Connected(val) { this.connected = val }
}

class MongoDBConnections extends EventEmitter
{
    constructor()
    {
        super()
        this.schemas = new Map()
        this.connections = new Map()
        this.mongoosePool = new Map()
    }

    get Names() {
        let that = this
        let names = []

        for(let name of that.connections.keys()) {
            names.push(name)
        }

        return names
    }

    get Schemas() { return this.schemas }

    appendSchema(schemas)
    {
        let that = this
        let database = (schemas.database) ? schemas.database : {}
        let entity = (schemas.entity) ? schemas.entity : {}

        let createSchema = (name, schema) => {

            let options = schema.options ?  schema.options : {}
            return {
                "name": name,
                "database": (schema['database']) ? schema['database'] : ((database.default) ? database.default : 'default') ,
                "model": (schema.model) ? schema.model : {},
                "collection": (options.collection) ? options.collection : name,
                "options": options
            }
        }

        Object.keys(entity)
            .forEach(name => {
                //create schema for every entity by name
                let schema = createSchema(name, entity[name])
                that.schemas.set(name, schema)
            })
    }

    getByConnectionString(connectionString)
    {
        let that = this

        for(let conn of that.connections.values()) {
            if (conn.ConnectionString === connectionString) return conn
        }

        throw new Error(`The connection string ${connectionString} wasn't initialized.`)
    }

    get(name)
    {
        let that = this

        return (that.connections.has(name)) ? that.connections.get(name) : null
    }

    create(name, connectionString, options)
    {
        let that = this

        //return connection from cache if it was creatd.
        if (that.connections.has(name)) return that.get(name)

        let conn = undefined

        //get mongoose connection by connection string
        if (that.mongoosePool.has(connectionString)){

            //get exist mongoose connection if it exists
            let existedConn = that.mongoosePool.get(connectionString)

            //create new instance of mongo db connection base on existed
            conn = new MongoDBConnection(name, connectionString, existedConn)
        }
        else {
            //use default options if it wasn't found
            if (options === undefined) options = defaultOptions

            //create new instance of mongoose connection
            let mongoConn = mongoose.createConnection(connectionString, options)

            if (!that.mongoosePool.has(connectionString)) {
                that.mongoosePool.set(connectionString, mongoConn)
            }

            //create new instance of mongo db connection
            conn = new MongoDBConnection(name, connectionString, mongoConn)

            //attached events
            that.attachEvents(conn)
        }

        if (conn !== undefined) {

            if (!that.connections.has(conn.Name)) {
                that.connections.set(conn.Name, conn)
            }
        }

        return conn
    }

    close(name)
    {
        let that = this

        let conn = that.get(name)
        if (!conn) return

        if (conn) {

            try {
                let mongoConn = conn.Connection
                if (!mongoConn) return
                mongoConn.close(err => that.emit('error', err, conn))
            }
            catch(err) {
                that.emit('error', err, conn)
            }
        }
    }

    remove(name)
    {
        let that = this

        if (!that.connections.has(name)) return

        let conn = that.connections.get(name)
        let mongoConn = conn.Connection

        mongoConn.close(err => that.emit('error', err, conn))

        if (that.mongoosePool.has(conn.ConnectionString)) {
            that.mongoosePool.delete(conn.ConnectionString)
        }

        that.connections.delete(name)
    }

    attachEvents(conn)
    {
        let that = this

        if (!conn || !conn.Connection) return

        let connection = conn.Connection

        connection.on('connected', () => that.emitEvent('connected', conn.connectionString))
        connection.on('open', () => that.emitEvent('open', conn.connectionString))
        connection.on('disconnected', () => that.emitEvent('disconnected', conn.connectionString))
        connection.on('close', () => that.emitEvent('close', conn.connectionString))
        connection.on('error', (err) => that.emit('error', err, conn))
    }

    emitEvent(name, connectionString)
    {
        for(let conn of this.connections.values()) {

            if (conn.ConnectionString === connectionString) {

                switch(name) {
                    case 'connected':
                        if (!conn.Connected) conn.Connected = true
                        break
                    case 'open':
                        break
                    case 'disconnected':
                        if (conn.Connected) conn.Connected = false
                        break
                    default:
                        break
                }

                this.emit(name, conn)
            }
        }
    }

}

module.exports = MongoDBConnections
