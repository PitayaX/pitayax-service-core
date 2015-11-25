'use strict'

const mysql = require('mysql')
const url = require('url')
const querystring = require('querystring')
const EventEmitter = require('events').EventEmitter

class MySQLDBConnection
{
  constructor()
  {
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

  execute(sql, callback)
  {
    const that = this
    let conn = undefined

    return new Promise((resolve, reject) => {

      const _query = (conn, sql, callback) => {

        //query data
        conn.query(sql, (err, results, fields) => {

          if (callback) callback(err, results, fields)
          else
          {
            if (err) reject(err)
            else resolve(that.repackageResult(results, fields))
          }

          if (that.PoolMode)
            conn.release()
          else conn.end()
        })
      }

      if (!that.PoolMode)
      {
        //create new instance of connections
        conn = mysql.createConnection(that.ConnectionString)

        //connect to database
        conn.connect()

        _query(conn, sql, callback)
      }
      else
      {
        //create pool
        if (that._pool === undefined)
        {
          that._pool = mysql.createPool(that.ConnectionString)
        }

        that._pool.getConnection( (err, conn) => {

          if (err)
          {
            if (callback) callback(err, null)
            else reject(err)
          }
          else
          {
            _query(conn, sql, callback)
          }
        } )
      }
    })
  }

  repackageData(data)
  {
    return JSON.parse(JSON.stringify(data))
  }

  repackageResult(results, fields)
  {
    if (this.OnlyResult)
      return results
    return {
      "results": results,
      "fields": fields
    }
    //return data.map( row => JSON.parse(JSON.stringify(row)) )
  }

  close()
  {
    const that = this

    if (that._pool !== undefined)
    {
      that._pool.end( err => {
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
    const parsedCS = this.parseConnectionString(connectionString, options)

    const
      conn = new MySQLDBConnection()
      conn.ConnectionString = parsedCS.cs
      conn.PoolMode = (parsedCS.extend.pool) ? true : false

    this._connections.set(name, conn)
  }

  parseConnectionString(connectionString, options)
  {
    const parsedUrl = url.parse(connectionString)
    if (parsedUrl.protocol !== 'mysql:') throw new Error('Invaild protocol for mysql.')

    const keys = ['charset', 'socketPath', 'timezone', 'connectionLimit', 'stringifyObjects',
                  'insecureAuth', 'typeCast', 'queryFormat', 'supportBigNumbers', 'bigNumberStrings',
                  'dateStrings', 'debug', 'trace', 'multipleStatements', 'flags', 'ssl',
                  'acquireTimeout', 'waitForConnections', 'connectionLimit', 'queueLimit'
                ]

    const auth = (parsedUrl.auth) ? parsedUrl.auth.split(':') : []
    const query = querystring.parse(parsedUrl.query)

    let database = parsedUrl.pathname
    if (database && database.indexOf('/') === 0) database = database.substring(1, database.length)

    const cs = { "host": parsedUrl.host }
    const extend = {}

    if (query)
    {
      keys.forEach( key => {if (query[key] !== undefined) cs[key] = query[key]} )
      if (query.pool)  extend.pool = {}
    }

    if (options)
    {
      keys.forEach( key => {if (options[key] !== undefined) cs[key] = options[key]} )
      if (options.pool !== undefined) extend.pool = options.pool
    }


    if (auth)
    {
      if (auth.length > 0) cs.user = auth[0]
      if (auth.length > 1) cs.password = auth[1]
    }

    if (parsedUrl.port) cs.port = parsedUrl.port
    if (database) cs.database = database

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
