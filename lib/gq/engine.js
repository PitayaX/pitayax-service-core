'use strict'

const aq = require('../promise/aq.js')
const conf = require('../conf/conf.js')
const ss = require('./script.js')

const Empty_Data = null

class Engine
{
  constructor(script)
  {
    if (!script) throw new Error('Invaild script')

    this.defaultAction = undefined
    this.context = new Map()
    this.dataAdapters = new Map()

    this.script = script
    this.script._context = {}

    this.args = []
    this.errors = []
  }

  get hasError() { return (this.errors.length == 0) ? false : true }

  get DefaultAction() { return this.defaultAction }
  set DefaultAction(value) { this.defaultAction = value }

  getDataAdapter(name)
  {
    //convert name to lower case
    name = name.toLowerCase()

    //return adapter
    return (this.dataAdapters.has(name)) ? this.dataAdapters.get(name) : undefined
  }

  setDataAdapter(name, adapter)
  {
    if (!adapter) throw new Error('invaild adapter!')

    //convert name to lower case
    name = name.toLowerCase()

    this.dataAdapters.set(name, adapter)
  }

  setContextItem(name, values)
  {
    const that = this

    let nc = that.context.name

    if (nc === undefined)
    {
      that.context.set(name, values)
    }
    else
    {
      nc = that.context.get(name)

      Object
        .keys(values)
        .forEach( key => nc[key] = values[key])
    }
  }

  static invoke(script, args, options, callback)
  {
    //create new instance of engine with script
    const engine = new Engine(script)

    //bind options to engine
    if (options)
    {
      Object
        .keys(options)
        .forEach( key => { engine.setContextItem(key, options[key])} )
    }

    //execute script
    return engine.execute(args, callback)
  }

  execute(args, callback)
  {
    //get instance of target
    const that = this

    //re-assign variants
    const $script = that.script

    //create new object for context
    let $ctx = {}

    //use empty array if argument doesn't exit
    if (!args) args = []

    return aq
      .Q(0)   //create a promise to start
      .then( () => {  //prepare arguments

        //generate arguments and fill values
        that.prepareArguments($script, args)

        //set script's action to default value
        if ($script.Action !== undefined) {

          if ($script.Action !== ss.DefaultAction)
            that.defaultAction = $script.Action
          else if (that.defaultAction === undefined)
            that.defaultAction = $script.Action
        }

        //create context for script scope
        $script._context = that.getContext($script)

        //return script
        return $script
      })
      .then( script => {  //submit parts

        //get context from script scope
        $ctx = that.getContext(script)

        //post datas before invoke
        if(script.before) script.before($ctx)

        //generate function to invoke parts
        const funcs = that.generateFuncs($script, Empty_Data)

        //return current data if there is no child part,
        //otherwise return a array of result for parts
        return (funcs.length == 0) ? {} : aq.parallel(funcs)
      })
      .then( data => that.unwrapData(data) )    //unwrapData
      .then( data => ($script.after) ? $script.after($ctx, data) : data )   //call after function
      .then( data => (callback) ? callback(null, data) : data )   //return result
      .catch( err => {  //catch unkown error
        if (err) that.errors.push(err)  //push error to objects

        if (callback) callback(err)     //invoke callback if it exists
        else throw err                  //throw exception
      })
  }

  generateFuncs(parent, data)
  {
    //get instance of target
    const that = this

    return Array
      .from( parent.Parts )
      .map( part => that.executePart(part, data) )
  }

  //executePart(part, data, callback)
  executePart(part, data)
  {
    //get instance of target
    const that = this

    //re-assign variants
    const $part = part

    //get context from part scope
    const $ctx = that.getContext($part)

    //process data before previous post
    const $data = ($part.before) ? $part.before($ctx, data) : data

    //invoke current part and process result
    return that
      .submitPart($part, $data)   //submit current body
      .then( data => {    //get result for current part
        //catched result if current part was defined identity
        if ($part.Id)
        {
          $ctx.global.returns.set($part.Id, $ctx.global.repackage(data))
        }

        data = $ctx.global.repackage(data)

        return data
      })
      .then( data => {
        if ($part.Relations.size == 0) return data

        const fillFuncs = []

        for( let relation of $part.Relations )
        {
          const bindFunc = that.fillRelation.bind(that, $ctx, data, relation)

          fillFuncs.push(bindFunc())
        }

        return aq.parallel(fillFuncs)
                .then( fd => data )
      })
      .then( data => {
        //generate function for children parts
        const funcs = that.generateFuncs($part, data)

        //return current data if there is no child part,
        //otherwise return a array of result for parts
        return ((funcs.length == 0) ? aq.Q(data) : aq.parallel(funcs))
      })
      .then( data => that.unwrapData(data) )
      .then( data => ($part.after) ? $part.after($ctx, data) : data )
  }

  submitPart(part, data)
  {
    //check arguments
    if (!part) return {}

    //get instance of target
    const that = this

    //get context form part
    const ctx = that.getContext(part)

    //get action name from part
    const
      action = (function(action) {
        if (!action) action = that.DefaultAction  //if the action wasn't defeind use script default value
        return (action === ss.DefaultAction) ? that.DefaultAction : action
      })(part.Action)

    //generate headers from part
    const
      headers = (function(headers) {
        if (!headers) return {}
        else if (headers instanceof Map)
          return headers.has(ss.Entry) ? headers.get(ss.Entry)(ctx, data) : headers.toObject()
        else if (typeof headers === 'function') return headers(ctx, data)
        else return headers
      })(part.Headers)

    //assign headers to context
    ctx.headers = (headers) ? headers : {}

    //call before post function
    if (part.beforePost) part.beforePost(ctx, data)

    //generate body from part
    const
      body = (function(body) {
        if (!body) return {}
        return (typeof body === 'function') ? body(ctx, data) : body
      })(part.Body)

    return that.execAction(ctx, action, headers, body)
  }

  fillRelation(ctx, data, relation)
  {
    const that = this

    if (relation.Joins.size == 0) return aq.Q(0)
    const keys = Array.from(relation.Joins.keys())

    const action = (relation.Action) ? relation.Action : that.defaultAction
    const headers = {
      "method": "retrieve",
      "target": relation.Target,
      "options": {
        "fields": Array.from(relation.As.Fields)
      }
    }
    const body = { "query": {} }

    if (keys.length == 1) //process single key
    {
      let mapKeys = []

      data.map( item => item[keys[0]] )
        .forEach( item => {

          if (Array.isArray(item))  //process array item
          {
            if (item.length == 0) return //ignore empty array
            else if (item.length == 1)
              mapKeys.push(item[0]) //push one element item
            else mapKeys.concat(item) //concat array item
          }
          else if(item) //process single item
          {
            mapKeys.push(item)  //push single item
          }
        })

        //remove duplication items
        mapKeys = mapKeys.filter( (item, pos) => mapKeys.indexOf(item) === pos )

      //set query object
      body["query"][relation.Joins.get(keys[0])] = {"$in": mapKeys}
    }
    else //process multi keys
    {
      //get keys for mapped target
      const mapedkeys = keys.map( key => relation.Joins.get(key) )

      //create new array for query
      const mapedPair =
        data.map( item => keys.map( key => item[key]) )
            .map( values => {
              const pair = {}

              for( let i = 0; i < mapedkeys.length; i++ ) {
                pair[mapedkeys[i]] = values[i]
              }

              return pair
            })

      //set query object
      body["query"] = {"$or": mapedPair}
    }

    return that
      .execAction(ctx, action, headers, body)
      .then( rdata => {

        for( let i = 0; i < data.length; i++ )
        {
          const row = data[i]

          let mapData = undefined
          for( let j = 0; j < keys.length; j++)
          {
            mapData = (mapData === undefined) ? rdata : mapData
            mapData = mapData.filter( ritem => {

              const fkey = relation.Joins.get(keys[j])
              const cell = row[keys[j]]
              if (Array.isArray(cell))
                return cell.indexOf(ritem[fkey])
              else return ritem[fkey] === cell
            })
          }

          const mapRow = (function() {
            if ((mapData !== undefined && mapData.length > 0))
              return (mapData.length === 1) ? mapData[0] : mapData
            else return {}
          })()

          row[relation.As.Name] = mapRow
        }

        return aq.Q(0)
      })
  }

  execAction(ctx, action, headers, body)
  {
    //assign the target to that
    const that = this

    switch(action.toLowerCase())
    {
      //case that.DefaultAction:
      case 'rest':

        const url = (headers.url) ? headers.url : ''
        if (url === '') throw new Error('not suport empty url for rest method')

        const restMethod = (headers.method) ? headers.method : 'GET'
        const restHeaders = (headers.headers) ? headers.headers : {}
        const restOptions = (headers.options) ? headers.options : {}
        const restBody = (body) ? body : {}

        return aq.rest(url, restMethod, restHeaders, restBody, restOptions)
      case 'mysql':
        throw new Error('not support')
      case 'mysql-orm':
      case 'mongo':

        //get instance of data adapter
        const dataAdapter = that.getDataAdapter(action)

        //check data adapter by
        if (dataAdapter === undefined) throw new Error(`doesn't defined ${action} adapter.`)

        let objectName = (headers.name) ? headers.name : undefined
        if (objectName === undefined) objectName = (headers.target) ? headers.target : undefined
        if (objectName === undefined) objectName = (ctx.name) ? ctx.name : undefined
        if (objectName === undefined) throw new Error(`can't find target object name.`)

        let dataOptions = (headers.options) ? headers.options : undefined

        const dataMethod = (headers.method) ? headers.method : 'retrieve'
        const dataBody = (body) ? body : {}

        switch(dataMethod.toLowerCase())
        {
          case 'create':
            return dataAdapter.create(objectName, dataBody)
          case 'retrieve':

            if (dataBody.query)
            {
              if (dataOptions === undefined) dataOptions = {}

              //dataOptions.filter = dataBody.query
              if (dataBody.fields) dataOptions.fields = dataBody.fields
              if (dataBody.projection) dataOptions.fields = dataBody.projection
              if (dataBody.sort) dataOptions.sort = dataBody.sort
              if (dataBody.page) dataOptions.page = dataBody.page
              if (dataBody.size) dataOptions.size = dataBody.size
            }

            return dataAdapter.retrieve(objectName, dataBody, dataOptions)
          case 'retrieveone':
            if (dataOptions === undefined) dataOptions = {}
            dataOptions.method = 'findOne'
            return dataAdapter.retrieve(objectName, dataBody, dataOptions)
          case 'update':
            if (dataBody.filter)
              return dataAdapter.update(objectName, dataBody.filter, dataBody.modifer)
            else return dataAdapter.update(objectName, undefined, dataBody)
          case 'delete':
            return dataAdapter.delete(objectName, dataBody)
          default:
            throw new Error(`doesn't support ${dataMethod} for current adapter`)
        }
        break

      case 'directly':
      default:
        return aq.Q(body)
    }
  }

  prepareArguments(script, args)
  {
    const that = this

    const initArgs = script => {

      //set default value for arguments
      Object.keys(script.Arguments)
        .forEach(key => {

            const arg = script.Arguments[key]

            if (!arg.Type) arg.Type = 'string'
            if (!arg.Default)
            {
              let isArray = (arg.Type.indexOf('array') == 0) ? true : false
              if (isArray)
              {
                arg.Default = []
              }
              else
              {
                switch(arg.Type.toLowerCase())
                {
                  case 'string':
                    arg.Default = ''
                    break
                  case "date":
                  case "time":
                  case "datetime":
                    arg.Default = new Date()
                    break
                  case 'number':
                  case 'float':
                  case 'int':
                  case 'integer':
                  case 'money':
                    arg.Default = 0
                    break
                  default:
                      throw new Error("Doesn't support type:" + arg.Type)
                }
              }
            }
        })
      }

      const fillArgs = (script, args) => {

        //get script and arguments
        const $script = script
        const $args = $script.Arguments

        //get names of arguments
        let argNames = $args.map(arg => arg.Name)
        if (argNames.length == 0) return

        //create instance of mapping
        let argsMap = {}
        if (Array.isArray(args)) {
          for(let i = 0; i < argNames.length; i++) {
            argsMap[argNames[i]] = (i < args.length) ? args[i] : undefined
          }
        }
        else {
          if (typeof args !== 'object') argsMap[argNames[0]] = (args) ? args : undefined
          else {
            let keys = Object.keys(args)
            if (keys.length === 0 && typeof args !== 'object')
            {
              argsMap[argNames[0]] = (args) ? args : undefined
            }
            else
            {
              keys.forEach(name => {
                if (!argsMap[name] == undefined) throw new Error(`Invalid argument name: ${name}`)
                argsMap[name] = (args[name]) ? args[name] : undefined
              })
            }
          }
        }

        $args.forEach(arg => {
            const value = argsMap[arg.Name]

            arg.Value = (value === undefined) ? arg.Default: value
        })
      }

      const checkArgs = (script, args) => {

        //get script and arguments
        const $script = script
        const $args = $script.Arguments

        Object.keys($args)
                .forEach(name => {
                    let arg = $args[name]
                    let isArray = (arg.Type.indexOf('array') == 0) ? true : false

                    if (isArray) {
                        let type = arg.Type.substring('array'.length + 1, arg.Type.length - 1)
                        arg.Value == arg.Value
                                        .map(value => checkArg(value, type, arg.Range))
                    }
                    else {
                        arg.Value = checkArg(arg.Value, arg.Type, arg.Range)
                    }
        })
      }

      const checkArg = (value, type, range) => {
        let result = undefined
        const err = new Error(`not support type: ${type}, value: ${value}`)

        switch(type) {
          case "string":
            return value.toString()
          case "date":
          case "time":
          case "datetime":
            if (typeof value === 'Date')
              result = value
            else if (typeof value === 'number')
              result = new Date(value)
            else if (typeof value === 'string'
              || typeof value === 'object')
              result = Date.parse(value)
            else throw err
            return result
          case "number":
          case "int":
          case "integer":
            if (typeof value === 'number')
              result = value
            else if (typeof value === 'string')
              result = Number.parseInt(value)
            else throw err

            return result
          case "float":
          case "money":
            return Number.parseFloat(value)
          default:
            throw new Error(`not support type: ${type}`)
        }
      }

      initArgs(script)
      fillArgs(script, args)
      checkArgs(script, args)
  }

  generateArgs(script)
  {
    let args = {}

    script.Arguments
      .forEach(arg => args[arg.Name] = arg.Value)

    return args
  }

  unwrapData(data)
  {
    if (Array.isArray(data)){
      if (data.length == 1) return data[0]
    }

    return data
  }

  getContext(parent)
  {
    //declare
    const that = this
    const script = (that.script) ? that.script : {}

    //get context from script
    const ctx = script.Context || {}

    //initialize context global, arguments and items in one times
    if (!ctx.global)
    {
      //create new object of global
      ctx.global = {}

      //process arguments
      ctx.args = that.generateArgs(script)

      //copy script context to current context
      if (that.context)
      {

        //get context item from engine
        for( let key of that.context.keys() )
        {
          //copy context from engine to script
          if (!ctx[key]) ctx[key] = that.context.get(key)
        }
      }

      //set returns map that include result for all parts that has id property
      ctx.global.returns = new Map()

      //create some global functions
      ctx.global.repackage = (data) => {
        //JSON.parse(JSON.stringify(data)
        if (Array.isArray(data)) {
          return data.map( row => {
            return (typeof row.toObject === 'function') ? row.toObject() : row
          })
        }
        else return (typeof data.toObject === 'function') ? data.toObject() : data
      }

      ctx.global.getItem = (id) => (ctx.global.returns.has(id) ? ctx.global.returns.get(id) : {})
    }

    //return instance of context for current scope
    return ctx
  }
}

module.exports = Engine
