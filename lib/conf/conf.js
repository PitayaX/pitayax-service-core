'use strict'

const jsYaml = require('js-yaml')

const SysKeyOfVersion = "$$version"
const SysKeyOfDescription = "$$description"

if (!Map.prototype.toObject) {
  Map.prototype.toObject
    = function() {

      const o = {}
      const that = this

      for (let key of that.keys()) {
          let val = that.get(key)
          if (val instanceof Map) o[key] = val.toObject()
          else o[key] = val
      }

      return o
    }
}


if (!Map.prototype.toJSON) {
  Map.prototype.toJSON
    = function() {
        return JSON.stringify(this.toObject())
    }
}

class ConfigMap extends Map
{
  constructor()
  {
    super()

    this.version = '1.0.0'
    this.description = ''
    this.Settings = {}
  }

  get Version() { return this.version }
  get Description() { return this.description }

  copy(map)
  {
    this.clear()
    this.merge(map)
  }

  merge(map)
  {
    if (map.Version) this.version = map.Version
    if (map.Description) this.description = map.Description

    if (map.size > 0)
    {
      (function fn(clonedMap, map)
      {
        for(let key of clonedMap.keys())
        {
          let item = clonedMap.get(key)

          //current key exists in mapping
          if (map.has(key))
          {
            let mitem = map.get(key);

            //check child keys
            if (mitem === item) continue
            else if (item instanceof Map)
              fn(item, mitem)     //recall fn by self
            else map.set(key, item) //change value by directly
          }
          else map.set(key, item) //append new key to map
        }

        return map
      })(map, this)
    }
  }

  clone() {
    const cfm = new ConfigMap()

    cfm.copy(this)

    return cfm
  }

  static parseMap(map) {
    //create new instance of ConfigMap
    const cf = new ConfigMap()

    //copy data from map
    cf.copy(map)

    //convert cf to JSON and parse it.
    return ConfigMap.parseJSON(cf.toJSON(true))
  }

  static parseYAML(yaml) {
    return ConfigMap.parse(jsYaml.safeLoad(yaml))
  }

  static parseJSON(json) {
    return ConfigMap.parse(JSON.parse(json))
  }

  static parse(options) {

    const cMap = new ConfigMap()

    //convert object to map object
    const parseKeys = (o, map) => {

      //create new instance of Map if the arg doesn't exist
      if (!map) map = new Map()
      if (!o) return map

      //fetch all key in object
      Object
        .keys(o)
        .forEach( function(key)
        {

          //ingore comment or system key
          if (key.startsWith('#') || key.startsWith('$$')) return

          //get value by key
          let value = o[key]

          if (Array.isArray(value))
          {
            value = value.map (v => (typeof v === 'object') ? parseKeys(v) : v )

            map.set(key, value)
            return
          }
          else if (typeof value === 'object')
          {
            //create new map for object value
            map.set(key, parseKeys(value))
            return
          }

          if (typeof value === 'string') {

            //allow use ${expression} to define a expression and apply it in runtime
            if (value.startsWith('${') && value.endsWith('}')) {

              const expression = value.substring(2, value.length - 1)

              try
              {
                //convert express to value
                value = eval(expression)
              }
              catch(err)
              {
                throw new Error(`Can't parse expression: ${expression}`)
              }
            }
          }

          map.set(key, value)    //set value by current key
        })

      //return created map
      return map
    }

    parseKeys(options, cMap)

    //append system varints
    if (options[SysKeyOfVersion] !== undefined) cMap.version = options[SysKeyOfVersion]
    if (options[SysKeyOfDescription] !== undefined) cMap.description = options[SysKeyOfDescription]

    const settings = options['settings'] || {}

    Object.keys(settings)
      .forEach(function(key) {

      cMap.Settings[key] = settings[key]
    })

    return cMap
  }
}

module.exports = ConfigMap
