'use strict'

let mongoose = require('mongoose')
let DbAdapter = require('./dbAdapter.js')

class MongoDBAdapter extends DbAdapter
{
    constructor(connections)
    {
        super()

        this.models = new Map()
        this.connections = connections
    }

    get Models() { return this.models }
    get Connections() { return this.connections }

    _create(model, body, resolver)
    {
        let entity = new model(body)

        entity.save(resolver)
    }

    _createWithIncrement(model, body, autoIncrement, wrapper, pending, callback)
    {
        return new Promise((resolve, reject) => {

            try {
                //init variants
                let field = (autoIncrement.field) ? autoIncrement.field : undefined
                if (!field) throw new Error('Can find auto increment field.')

                //get variants for auto increment
                let start = (autoIncrement.startValue) ? autoIncrement.startValue : 0
                let step = (autoIncrement.step) ? autoIncrement.step : 1

                //find the maximun value for auto increment field
                let filter = JSON.parse(`{"$query": {}, "$orderby": {"${field}": -1}}`)
                let projection = JSON.parse(`{"${field}": 1, "_id": 0}`)

                model.findOne(filter, projection)
                    .then( data => {
                        //increase value if found old data in database
                        body[field] = (data) ? data[field] + step : start

                        return body
                    })
                    .then( body => {

                        callback(model, (err, data) => {

                            //reject error
                            if (err) throw err

                            //wrapper data
                            if (wrapper) {
                                if (wrapper.from) data = wrapper.from(data)
                            }

                            //resolve data
                            resolve(data)
                        })
                    })
                    .catch( err => {

                        if (err.code == 11000) {
                            return pending(model, body, autoIncrement, wrapper, pending, callback)
                        }

                        reject(err)
                    })
            }
            catch(err){
                reject(err)
            }
        })
    }

    _retrieve(model, method, resolver, options)
    {
        //parse options
        let filter = (options.filter) ? options.filter : {}
        let projection = (options && options.projection) ? options.projection : undefined
        let sort = (options && options.sort) ? options.sort : undefined
        let pager = (options.page && options.pageSize) ? {"page": options.page, "size": options.pageSize} : undefined

        if (projection === undefined) projection = (options && options.fields) ? options.fields : undefined

        //ready for invoking method
        let op = model[method]

        //call method with arguments
        let pending = op.call(model, filter, projection)

        if (method === 'count' || method === 'findOne') {
            //do nothing for count or findOne method
        }
        else {
            //pending sorter
            if (sort) {
                pending = pending.sort()
            }

            //pending pager
            if (pager) {
                pending = pending.skip(pager.size * (pager.page - 1))
                                .limit(pager.size)
            }
        }

        //execute resolver
        return pending.exec(resolver)
    }

    _update(model, resolver, filter, modifier)
    {
        model.update(filter, modifier, resolver)
    }

    _delete(model, resolver, filter)
    {
        model.remove(filter, resolver)
    }

    createModel(name)
    {
        let that = this

        //get schema by entity name
        let schema = that.getSchema(name)
        if (schema == null) throw new Error(`Can't find model by schema: ${name}`)

        //get connection by entity name from pool
        let conn = that.Connections.get(schema.database)
        if (conn == null) throw new Error(`Can't find model by database: ${name}`)

        //get mongo connection from connection
        let mongoConnection = conn.Connection
        if (!mongoConnection) {
            throw new Error(`Can't find mongoose connection by database: ${name}`)
        }

        //mongoConnection.name(name, )
        let mongoSchema = mongoose.Schema(schema.model, schema.options || {})
        let modelNames = mongoConnection.modelNames()

        //create mongoose model by name and schema
        let model = mongoConnection.model(name, mongoSchema)

        //append prototypes
        if (model) {
            model.prototype.__name = schema.name
            model.prototype.__schema = schema
        }

        return model
    }

    getModel(name)
    {
        let that = this

        if (!that.models.has(name)) {
            that.models.set(name, that.createModel(name))
        }

        return that.models.get(name)
    }

    getSchema(name)
    {
        let that = this

        return (that.Connections.Schemas.has(name))
                ? that.Connections.Schemas.get(name)
                : null
    }

    getWrapper(name)
    {
        return {"from": null, "to": null}
    }
}

module.exports = MongoDBAdapter
