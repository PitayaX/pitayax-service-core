'use strict'

const SchemaCache = require('./schemaCache.js')
const mongoose = require('mongoose')
const EventEmitter = require('events').EventEmitter

const schemaType = 'mongo'

const defaultOptions = {
  db: { native_parser: true },
  auth: { authdb: "admin" },
  server: { poolSize:10 }
}

class MongoDBConnection
{
  constructor(name, connectionString, connection)
  {
    this._name = name
    this._connectionString = connectionString
    this._connection = connection
    this._connected = false
  }

  get Name() { return this._name }
  get ConnectionString() { return this._connectionString }
  get Connection() { return this._connection }

  get Connected() { return this._connected }
  set Connected(val) { this._connected = val }
}

class MongoDBConnections extends EventEmitter
{
  constructor()
  {
      super()
      //this.schemas = new Map()
      this._schemas = SchemaCache.create()
      this._connections = new Map()
      this._mongoosePool = new Map()
  }

  get Names() {
      let that = this
      let names = []

      for(let name of that._connections.keys()) {
          names.push(name)
      }

      return names
  }

  get Schemas() { return this._schemas.getSchemas(schemaType) }

  appendSchema(schemas)
  {
    this._schemas.createSchemas(schemas, schemaType)
  }

  getByConnectionString(connectionString)
  {
    for(let conn of this._connections.values()) {
        if (conn.ConnectionString === connectionString) return conn
    }

    throw new Error(`The connection string ${connectionString} wasn't initialized.`)
  }

  get(name)
  {
    return (this._connections.has(name)) ? this._connections.get(name) : null
  }

  create(name, connectionString, options)
  {
    const that = this

    //return connection from cache if it was creatd.
    if (that._connections.has(name)) return that.get(name)

    let conn = undefined

    //get mongoose connection by connection string
    if (that._mongoosePool.has(connectionString))
    {

      //get exist mongoose connection if it exists
      let existedConn = that._mongoosePool.get(connectionString)

      //create new instance of mongo db connection base on existed
      conn = new MongoDBConnection(name, connectionString, existedConn)
    }
    else
    {
      //use default options if it wasn't found
      if (options === undefined) options = defaultOptions

      //create new instance of mongoose connection
      let mongoConn = mongoose.createConnection(connectionString, options)

      if (!that._mongoosePool.has(connectionString))
      {
          that._mongoosePool.set(connectionString, mongoConn)
      }

      //create new instance of mongo db connection
      conn = new MongoDBConnection(name, connectionString, mongoConn)

      //attached events
      that.attachEvents(conn)
    }

    if (conn !== undefined) {

      if (!that._connections.has(conn.Name)) {
          that._connections.set(conn.Name, conn)
      }
    }

    return conn
  }

  close(name)
  {
    let that = this

    let conn = that.get(name)
    if (!conn) return

    if (conn)
    {

      try
      {
        let mongoConn = conn.Connection
        if (!mongoConn) return

        mongoConn.close( err => {
          if (err) that.emit('error', err, conn)
        })
      }
      catch(err)
      {
        that.emit('error', err, conn)
      }
    }
  }

  remove(name)
  {
    let that = this

    if (!that._connections.has(name)) return

    let conn = that._connections.get(name)
    let mongoConn = conn.Connection

    mongoConn.close(err => {
      if (err) that.emit('error', err, conn)
    })

    if (that._mongoosePool.has(conn.ConnectionString)) {
        that._mongoosePool.delete(conn.ConnectionString)
    }

    that._connections.delete(name)
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
    for(let conn of this._connections.values()) {

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
