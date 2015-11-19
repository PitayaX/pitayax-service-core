'use strict'

let mongoose = require('mongoose')
let DbAdapter = require('./dbAdapter.js')

class MongoDBAdapter extends DbAdapter
{
  constructor(connections)
  {
    super()

    //this.models = new Map()
    if (connections.models === undefined) {
      connections.models = new Map()
    }

    this.connections = connections
  }

  get Models() { return this.models }
  get Connections() { return this.connections }

  _create(model, body, resolver)
  {
    let entity = new model(body)

    if (!this.ValidateBeforeSave)
    {
      entity.save(resolver)   //save entity directly
    }
    else
    {
      //validate schema in the first
      entity.validate( err => {

        if (err) {
          //found issue, exit
          resolver(new Error('validate schema failed, details:' + err.message))
          return
        }

        //save entity
        entity.save(resolver)
      })
    }
  }

  _createWithIncrement(model, body, autoIncrement, wrapper, pending, callback)
  {
    return new Promise((resolve, reject) => {

      try
      {
        //init variants
        const field = (autoIncrement.field) ? autoIncrement.field : undefined
        if (!field) throw new Error('Can find auto increment field.')

        //get variants for auto increment
        const start = (autoIncrement.startValue) ? autoIncrement.startValue : 0
        const step = (autoIncrement.step) ? autoIncrement.step : 1

        //find the maximun value for auto increment field
        const filter = JSON.parse(`{"$query": {}, "$orderby": {"${field}": -1}}`)
        const projection = JSON.parse(`{"${field}": 1, "_id": 0}`)

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
              if (wrapper && wrapper.from) {
                data = wrapper.from(data)
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
      catch(err)
      {
        reject(err)
      }
    })
  }

  _retrieve(model, method, resolver, options)
  {
    //parse options
    const filter = (options.filter) ? options.filter : {}
    const sort = (options && options.sort) ? options.sort : undefined
    const pager = (options.page && options.pageSize) ? {"page": options.page, "size": options.pageSize} : undefined

    //convert
    let projection = (options && options.projection) ? options.projection : undefined
    if (projection === undefined) projection = (options && options.fields) ? options.fields : undefined
    if (projection !== undefined && Array.isArray(projection)) {

      const newFields = {}
      projection.forEach( field => newFields[field] = 1)
      if (newFields['_id'] === undefined) newFields['_id'] = 0
      projection = newFields
    }

    //ready for invoking method
    const op = model[method]

    //call method with arguments
    let pending = op.call(model, filter, projection)

    if (!(method === 'count' || method === 'findOne'))
    {
      //pending sorter
      if (sort) {
          pending = pending.sort(sort)
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
    const that = this

    //get schema by entity name
    const schema = that.getSchema(name)
    if (schema == null) throw new Error(`Can't find model by schema: ${name}`)

    //get connection by entity name from pool
    const conn = that.Connections.get(schema.database)
    if (conn == null) throw new Error(`Can't find model by database: ${name}`)

    //get mongo connection from connection
    const mongoConnection = conn.Connection
    if (!mongoConnection) {
      throw new Error(`Can't find mongoose connection by database: ${name}`)
    }

    const evalValue = (parent => {
      Object
        .keys(parent)
        .forEach(key => {

          let current = parent[key]

          if ( typeof current === 'object' ) evalValue(current)
          else if ( typeof current === 'string'
            && (current.startsWith('${') && current.endsWith('}')))
          {
            parent[key] = eval('(function() { return ' + current.substr(2, current.length - 3) + ' })')
          }
        })

      return parent
    })

    schema.model = evalValue(schema.model)

    //mongoConnection.name(name, )
    const mongoSchema = mongoose.Schema(schema.model, schema.options || {})
    const modelNames = mongoConnection.modelNames()

    //create mongoose model by name and schema
    const model = mongoConnection.model(name, mongoSchema)

    //append prototypes
    if (model) {
      model.prototype.__name = schema.name
      model.prototype.__schema = schema
    }

    return model
  }

  getModel(name)
  {
    const that = this
    const models = that.connections.models

    if (!models.has(name)) {
      models.set(name, that.createModel(name))
    }

    return models.get(name)
  }

  getSchema(name)
  {
    const that = this

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
