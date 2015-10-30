'use strict'
//require('script')

let ss = require('./script.js')
let aq = require('../promise/aq.js')

const Empty_Data = null

class Engine
{
    constructor(script)
    {
        if (!script) throw new Error('Invaild script')

        this.defaultAction = ss.DefaultAction
        this.context = new Map()
        this.dataAdapters = new Map()
        this.script = script
        this.script.context = {}

        this.args = []
        this.errors = []
    }

    get hasError() { return (this.errors.length == 0) ? false : true }

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
        let that = this
        let nc = that.context.name

        if (nc === undefined)
            that.context.set(name, values)
        else {
            nc = that.context.get(name)

            Object.keys(values)
                .forEach( key => nc[key] = values[key])
        }
    }

    get MongoAdapter() { return this.mongoAdapter }
    set MongoAdapter(value ) { this.mongoAdapter = value }

    get DefaultAction() {return this.defaultAction}
    set DefaultAction(value) {this.defaultAction = value }

    static invoke(script, args, options, callback)
    {
        //create new instance of engine with script
        let engine = new Engine(script)

        //bind options to engine
        if (options) {
            Object.keys(options)
                .forEach(key => {
                    engine.setContextItem(key, options[key])
                })

        }

        //execute script
        return engine.execute(args, callback)
    }

    execute(args, callback)
    {
        //get instance of target
        let that = this

        //use empty array if argument doesn't exit
        if (!args) args = []

        //re-assign variants
        let $script = that.script
        let $ctx = {}

        return (aq
            .Q(0)
            .then(() => {
                //declare script and arguments
                $script.owner = that

                //prepare arguments
                that.prepareArguments($script, args)

                //set script's action to default value
                that.defaultAction = $script.action

                //create context for script scope
                $script.context = that.getContext($script)

                return $script
            })
            .then(script => {

                //get context from script scope
                $ctx = that.getContext(script)

                //post datas before invoke
                if(script.before) script.before($ctx)

                //declare array of all functions
                let funcs = that.getParts($script)
                                .map( part => {
                                                part.owner = script.owner
                                                return part
                                            })
                                .map( part => that.executePart(part, Empty_Data) )

                return (funcs.length == 0) ? {} : aq.parallel(funcs)
            })
            .then( data => that.unwrapData(data) )
            .then( data => ($script.after) ? $script.after($ctx, data) : data )
            .then( data => (callback) ? callback(null, data) : data )
            .catch( err => {
                if (err) that.errors.push(err) //push error to objects
                if (callback) callback(err)    //invoke callback if it exists
                else throw err                 //throw exception
            }))
    }

    //executePart(part, data, callback)
    executePart(part, data)
    {
        //get instance of target
        let that = (part.owner) ? part.owner : this

        //re-assign variants
        let $part = part, $data = data

        //get context from part scope
        let $ctx = that.getContext($part)

        //process data before post
        $data = ($part.before) ? $part.before($ctx, $data) : $data

        return that.postBody($part, $data)
                .then(data => {

                    //generate execute functions
                    let funcs =
                        that.getParts($part)      //get parts in script
                            .map( part => {
                                            part.owner = $part.owner
                                            return part
                                        })
                            .map( part => that.executePart(part, data) )

                    return ((funcs.length == 0) ? aq.Q(data) : aq.parallel(funcs))
                                .then( data => that.unwrapData(data) )
                                .then( data => ($part.after) ? $part.after($ctx, data) : data )
                })
    }

    postBody(part, data)
    {
        //check
        if (!part) return data

        //get instance of target
        let that = (part.owner) ? part.owner : this

        //get context form part
        let ctx = that.getContext(part)

        if (part.beforePost) part.beforePost(ctx, data)

        let headers = part.headers, body = part.body
        let action = (part.action) ? part.action : this.DefaultAction

        headers = (headers) ? ((typeof(headers) === 'function') ? headers(ctx): headers) : {}
        body = (body) ? ((typeof(body) === 'function') ? body(ctx, data) : body) : {}

        return that.doAction(action, part, headers, body)
    }

    doAction(action, part, headers, body)
    {
        let $part = part
        let that = ($part.owner) ? $part.owner : this
        let $headers = headers

        action = action.toLowerCase()

        switch(action) {
            //case that.DefaultAction:
            case 'rest':

                let url = ($headers.url) ? $headers.url : ''
                if (url === '') throw new Error('not suport empty url for rest method')

                let restMethod = ($headers.method) ? $headers.method : 'GET'
                let restHeaders = ($headers.headers) ? $headers.headers : {}
                let restOptions = ($headers.options) ? $headers.options : {}
                let restBody = (body) ? body : {}

                return aq.rest(url, restMethod, restHeaders, restBody, restOptions)
            case 'mysql':
            case 'mongo':

                //get instance of data adapter
                let dataAdapter = that.getDataAdapter(action)

                //check data adapter by
                if (dataAdapter === undefined) throw new Error(`doesn't defined ${action} adapter.`)

                let objectName = ($headers.name) ? $headers.name : undefined
                if (objectName === undefined) throw new Error(`can't find target object name.`)

                let dataMethod = ($headers.method) ? $headers.method : 'retrieve'
                let dataOptions = ($headers.options) ? $headers.options : undefined
                let dataBody = (body) ? body : {}

                switch(dataMethod){
                    case 'create':
                        return dataAdapter.create(objectName, dataBody)
                    case 'retrieve':
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
        let initArgs = script => {

            //set default value for arguments
            Object.keys(script.Arguments)
                .forEach(key => {
                    let arg = script.Arguments[key]

                    if (!arg.type) arg.type = 'string'
                    if (!arg.default) {
                        let isArray = (arg.type.indexOf('array') == 0) ? true : false
                        if (isArray) {
                            arg.default = []
                        }
                        else {
                            switch(arg.type) {
                                case 'string':
                                    arg.default = ''
                                    break
                                case "date":
                                case "time":
                                case "datetime":
                                    arg.default = new Date()
                                    break
                                case 'number':
                                case 'float':
                                case 'int':
                                case 'integer':
                                case 'money':
                                    arg.default = 0
                                    break
                                default:
                                    throw new Error("Doesn't support type:" + arg.type)
                            }
                        }
                    }
                })
        }

        let fillArgs = (script, args) => {
            //get owner
            let that = (script.owner) ? script.owner : this

            //get script and arguments
            let $script = script
            let $args = $script.Arguments

            //get names of arguments
            let argNames = $args.map(arg => arg.name)
            if (argNames.length == 0) return

            //create instance of mapping
            let argsMap = {}
            if (Array.isArray(args)) {
                for(let i = 0; i < argNames.length; i++) {
                    argsMap[argNames[i]] = (i < args.length) ? args[i] : undefined
                }
            }
            else {
                if (typeof(args) !== 'object') argsMap[argNames[0]] = (args) ? args : undefined
                else {
                    let keys = Object.keys(args)
                    if (keys.length == 0)
                        argsMap[argNames[0]] = (args) ? args : undefined
                    else {

                        keys.forEach(name => {
                            if (!argsMap[name] == undefined) throw new Error(`Invalid argument name: ${name}`)
                            argsMap[name] = (args[name]) ? args[name] : undefined
                        })
                    }
                }
            }

            $args.forEach(arg => {
                let value = argsMap[arg.name]
                arg.value = (value === undefined) ? arg.default: value
            })
        }

        let checkArgs = (script, args) => {
            //get owner
            let that = (script.owner) ? script.owner : this

            //get script and arguments
            let $script = script
            let $args = $script.Arguments

            Object.keys($args)
                    .forEach(name => {
                        let arg = $args[name]
                        let isArray = (arg.type.indexOf('array') == 0) ? true : false

                        if (isArray) {
                            let type = arg.type.substring('array'.length + 1, arg.type.length - 1)
                            arg.value == arg.value
                                            .map(value => checkArg(value, type, arg.range))
                        }
                        else {
                            arg.value = checkArg(arg.value, arg.type, arg.range)
                        }
            })
        }

        let checkArg = (value, type, range) => {
            let result = undefined
            let err = new Error(`not support type: ${type}, value: ${value}`)

            switch(type) {
                case "string":
                    return value.toString()
                case "date":
                case "time":
                case "datetime":
                    if (typeof(value) === 'Date')
                        result = value
                    else if (typeof(value) === 'number')
                        result = new Date(value)
                    else if (typeof(value) === 'string'
                        || typeof(value) === 'object')
                        result = Date.parse(value)
                    else throw err

                    return result
                case "number":
                case "int":
                case "integer":
                    if (typeof(value) === 'number')
                        result = value
                    else if (typeof(value) === 'string')
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
            .forEach(arg => args[arg.name] = arg.value)

        return args
    }

    getParts(parent)
    {
        let parts = (parent) ? ((parent.parts) ? parent.parts : []) : []
        if (!Array.isArray(parts)) parts = [parts]

        return parts
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
        let that = (parent.owner) ? parent.owner : this
        let script = (that.script) ? that.script : {}

        //get context from script
        let ctx = script.context || {}

        //initialize context global, arguments and items in one times
        if (!ctx.global) {
            ctx.global = {}

            //process arguments
            ctx.args = that.generateArgs(script)

            if (that.context) {
                //get context item from engine
                for( let key of that.context.keys() ) {

                    //copy context from engine to script
                    if (!ctx[key]) ctx[key] = that.context.get(key)
                }
            }
        }

        //get headers from parent
        ctx.headers = (() => {

            //get headers from parent item`
            let headers = (parent.headers) ? parent.headers : {}

            //process headers, it will overwrite old items and always get headers from parent
            return (typeof headers === 'function') ? headers(ctx) : headers
        })()

        //return instance of context for current scope
        return ctx
    }
}

module.exports = Engine
