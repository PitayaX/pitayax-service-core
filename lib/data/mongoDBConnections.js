'use strict';

let mongoose = require('mongoose');
let EventEmitter = require('events').EventEmitter;
let util = require("util");

const defaultOptions = {
    db: { native_parser: true },
    auth: { authdb: "admin" },
    server: { poolSize:10 }
}

class MongoDBConnection
{
    constructor(name, connectionString, connection)
    {
        this.name = name;
        this.connectionString = connectionString;
        this.connection = connection;
        this.connected = false
    }

    get Name() { return this.name; }
    get ConnectionString() { return this.connectionString; }
    get Connection() { return this.connection; }

    get Connected() { return this.connected; }
    set Connected(val) { this.connected = val; }
}

class MongoDBConnections extends EventEmitter
{
    constructor()
    {
        super();
        this.namesMap = new Map();
        this.connections = new Map();
    }

    get(connectionString)
    {
        let that = this;

        if (that.connections.has(connectionString)) {
            return that.connections.get(connectionString);
        }

        throw new Error(`The connection string ${connectionString} wasn't initialized.`)
    }

    getByName(name)
    {
        let that = this;
        console.log(that.namesMap);
        if (that.namesMap.has(name)) {
            let connectionString = that.namesMap.get(name);
            return that.get(connectionString);
        }

        throw new Error(`Invaild name: ${name} in connections`);
    }

    create(name, connectionString, options)
    {
        let that = this;

        //return connection from cache if it was creatd.
        if (that.namesMap.has(name)) return that.getByName(name);

        let conn = undefined;

        if (that.connections.has(connectionString)){

            let existedConn = that.get(connectionString);

            //create new instance of mongo db connection base on existed;
            conn = new MongoDBConnection(name, connectionString, existedConn.Connection);
        }
        else {

            //use default options if it wasn't found
            if (options === undefined) options = defaultOptions

            //create new instance of mongoose connection
            let connection = mongoose.createConnection(connectionString, options);

            //create new instance of mongo db connection;
            conn = new MongoDBConnection(name, connectionString, connection);

            //attached events
            that.attachEvents(conn);
        }

        if (conn !== undefined) {

            if (!that.namesMap.has(conn.Name)) {
                that.namesMap.set(conn.Name, conn.ConnectionString);
            }
            that.connections.set(conn.ConnectionString, conn);
        }

        return conn;
    }

    close(name)
    {
        let that = this;

        let conn = that.getByName(name);

        if (conn) {
            let connection = conn.Connection;
            if (connection) connection.close();
        }
    }

    attachEvents(conn)
    {
        let that = this;

        if (!conn || !conn.Connection) return;

        let connection = conn.Connection;

        connection.on('connected', () => {
            conn.Connected = true;

            that.emit('connected', conn);
        });

        connection.on('open', () => {
            //console.log('open');
            conn.Connected = true;

            that.emit('open', conn);
        });

        connection.on('disconnected', () => {
            conn.Connected = false;

            that.emit('disconnected', conn);
        });
    }
}

//util.inherits(MongoDBConnections, EventEmitter);

module.exports = MongoDBConnections;
