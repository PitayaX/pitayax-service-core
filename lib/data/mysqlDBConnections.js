'use strict'

const mysql = require('mysql')
const url = require('url')
const querystring = require('querystring')
const EventEmitter = require('events').EventEmitter

class MySQLDBConnection extends EventEmitter
{
  constructor()
  {
    super()

    this._onlyResult = true
    this._pool = undefined
    this._poolMode = false
    this._connectionString = {}
  }

  get PoolMode() { return this._poolMode }
  set PoolMode(val) { this._poolMode = val}

  get OnlyResult() { return this._onlyResult }
  set OnlyResult(val) { this._onlyResult = val}

  get ConnectionString() { return this._connectionString }
  set ConnectionString(val) { this._connectionString = val }

  getPool(connectionString)
  {
    const that = this

    //create pool
    if (that._pool === undefined) {
      that._pool = mysql.createPool(connectionString)
    }

    return that._pool
  }

  createConnection()
  {
    const that = this
    const connectionString = that.ConnectionString

    return new Promise((resolve, reject) => {

      const resolver = (err, conn) => {
        if (err) reject(err)
        else {
          //attached events for current conn
          that.attachEventsByConn(conn)

          resolve(conn)
        }
      }

      if (that.PoolMode)
      {
        const pool = that.getPool(connectionString)
        that._pool.getConnection((err, conn) => resolver(err, conn))
      }
      else
      {
        //create new instance of connections
        const conn = mysql.createConnection(that.ConnectionString)

        //connect to database
        conn.connect( err => resolver(err, conn))
      }
    })
  }

  closeConnection(conn)
  {
    if (this.PoolMode)
      conn.release()
    else conn.end()
  }

  query(conn, sql, callback)
  {
    const that = this
    return new Promise((resolve, reject) => {

      try
      {
        //execute query on connection
        conn.query(sql, (err, results, fields) => {

          if (err) throw err  //throw error if found

          if (callback) callback(err, results, fields)
          else resolve(that.repackageResult(results, fields))

          that.closeConnection(conn)  //close connection
        })
      }
      catch(err)
      {
        if (callback)
          callback(err)
        else reject(err)
      }
    })
  }

  execute(sql, callback)
  {
    const that = this
    let conn = undefined

    return new Promise((resolve, reject) => {

      that.createConnection()
        .then( conn => {

          //execute query on connection
          conn.query(sql, (err, results, fields) => {

            if (err) throw err  //throw error if found

            if (callback) callback(err, results, fields)
            else resolve(that.repackageResult(results, fields))

            that.closeConnection(conn)  //close connection
          })
        })
        .catch( err => {
          if (callback)
            callback(err)
          else reject(err)
        })
    })
  }

  attachEventsByConn(conn)
  {
    const that = this

    conn.on('error', (err) => {if (err) that.emit('error', err, conn)})
  }

  repackageData(data)
  {
    return JSON.parse(JSON.stringify(data))
  }

  repackageResult(results, fields)
  {
    return (this.OnlyResult)
            ? results
            : ({ "results": results, "fields": fields })
  }

  end()
  {
    const that = this

    if (that._pool !== undefined)
    {
      that._pool.end( err => {
        if (err) that.emit('error', err, that._pool)

        that._pools = undefined
      })
    }
  }
}

class MySQLDBConnections extends EventEmitter
{
  constructor()
  {
    super()

    this._connections = new Map()
  }

  get(name)
  {
    if (!this._connections.has(name))
      throw new Error(`can't find name: ${name} in connections`)

    return this._connections.get(name)
  }

  create(name, connectionString, options)
  {
    //parse connection with options
    const parsedCS = this.parseConnectionString(connectionString, options)

    //create new instance of mysql connectonn with options
    const
      conn = new MySQLDBConnection()
      conn.ConnectionString = parsedCS.cs
      conn.PoolMode = (parsedCS.extend.pool == true) ? true : false

    //save to cache
    this._connections.set(name, conn)
  }

  parseConnectionString(connectionString, options)
  {
    const parsedUrl = url.parse(connectionString)
    if (parsedUrl.protocol !== 'mysql:') throw new Error('Invaild protocol for mysql.')

    const keys = [
      'charset', 'socketPath', 'timezone', 'connectionLimit', 'stringifyObjects',
      'insecureAuth', 'typeCast', 'queryFormat', 'supportBigNumbers', 'bigNumberStrings',
      'dateStrings', 'debug', 'trace', 'multipleStatements', 'flags', 'ssl',
      'acquireTimeout', 'waitForConnections', 'connectionLimit', 'queueLimit'
    ]

    //create connection string object
    const cs = { "host": parsedUrl.host }

    const auth = (parsedUrl.auth) ? parsedUrl.auth.split(':') : []
    const query = querystring.parse(parsedUrl.query)

    let database = parsedUrl.pathname
    if (database && database.indexOf('/') === 0) database = database.substring(1, database.length)

    //parse auth info from href
    if (auth)
    {
      if (auth.length > 0) cs.user = auth[0]
      if (auth.length > 1) cs.password = auth[1]
    }

    //parse port from href
    if (parsedUrl.port) cs.port = parsedUrl.port

    //parse database name from href
    if (database) cs.database = database

    //create extend properties object
    const extend = {}

    //define pool mode
    let pool = undefined

    //parse connection parameters form query string
    if (query)
    {
      keys.forEach( key => {if (query[key] !== undefined) cs[key] = query[key]} )
      if (query.pool) pool = query.pool
    }

    //parse connection parameters form options
    if (options)
    {
      keys.forEach( key => {if (options[key] !== undefined) cs[key] = options[key]} )
      if (options.pool) pool = options.pool
    }

    //set pool mode or not for extend properties
    extend.pool = function(val){
      if (!val) return false
      if (typeof val === 'string')
        return (val === 'true') ? true : false
      return new Boolean(val)
    }(pool)

    return {
      "cs": cs,
      "extend": extend
    }
  }

  close(name)
  {
  }
}

module.exports = MySQLDBConnections
