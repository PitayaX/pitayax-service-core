'use strict'

const defaultType = 'mongo'
const fs = require('fs')
const path = require('path')

let __instance = undefined

class SchemaCache
{
  constructor()
  {
    this.schemas = new Map()
  }

  get Test() { return 'test' }

  static create()
  {
    if (__instance === undefined) {
      __instance = new SchemaCache()
    }
    return __instance
  }

  add(file, type)
  {
    const info = path.parse(file)
    console.log(info)

    if (info.ext === '.js') this.addJS(file, type)
    else if (info.ext === '.json') this.addJSON(file, type)
    else {
      throw new Error('not support the extend name: ' + (info) ? info.ext : '')
    }
  }

  addJS(file, type)
  {
    const content = '(function() {\r\n return ' + fs.readFileSync(file, 'utf-8') + ' \r\n})()'

    this.createSchemas(eval(content), type)
  }

  addJSON(file, type)
  {
    this.createSchemas(JSON.parse(fs.readFileSync(file, 'utf-8')), type)
  }

  createSchemas(schemas, type)
  {
    //assign target to that
    const that = this

    //get variants from schemas
    if (!type) type = (schemas.type) ? schemas.type : defaultType

    const database = (schemas.database) ? schemas.database : {}
    const entity = (schemas.entity) ? schemas.entity : {}

    const createSchema = (name, schema) => {

      const options = schema.options ?  schema.options : {}

      const
        item = { "name": name }
        item.database = (schema['database']) ? schema['database'] : ((database.default) ? database.default : 'default')
        item.model = (schema.model) ? schema.model : {}
        item.options = options

      switch(type)
      {
        case 'mongo':
          item.collection = (options.collection) ? options.collection : name
          //if (item.options.collection) delete item.options.collection
          break;
        default:
          break;
      }

      return item
    }

    //get schemas for current type
    const cache = (function() {

      if (!that.schemas.has(type))
        that.schemas.set(type, new Map())
      return that.schemas.get(type)
    })()

    //fetch every entity in schemas
    Object
      .keys(entity)
      .forEach(name => {
        //create schema for every entity by name
        cache.set(name, createSchema(name, entity[name]))
      })
  }

  getSchemas(type)
  {
    return (this.schemas.has(type)) ? this.schemas.get(type) : new Map()
  }
}

module.exports = SchemaCache
