'use strict';
//require('script')

let aq = require('../promise/aq.js');

const Empty_Data = null;

class Engine
{
    constructor(script)
    {
        if (!script) throw new Error('Invaild script');

        this.script = script;
        this.script.context = {};

        this.args = [];
        this.errors = [];
    }

    get hasError() {
        return (this.errors.length == 0) ? false : true;
    }

    initArgs(script)
    {
        //set default value for arguments
        Object.keys(script.Arguments)
            .forEach(key => {
                let arg = script.Arguments[key];

                if (!arg.type) arg.type = 'string';
                if (!arg.default) {
                    let isArray = (arg.type.indexOf('array') == 0) ? true : false;
                    if (isArray) {
                        arg.default = [];
                    }
                    else {
                        switch(arg.type) {
                            case 'string':
                                arg.default = '';
                                break;
                            case "date":
                            case "time":
                            case "datetime":
                                arg.default = new Date();
                                break;
                            case 'number':
                            case 'float':
                            case 'int':
                            case 'integer':
                            case 'money':
                                arg.default = 0;
                                break;
                            default:
                                throw new Error("Doesn't support type:" + arg.type);
                        }
                    }
                }
            });
    }

    fillArgs(script, args)
    {
        //get owner
        let that = (script.owner) ? script.owner : this;

        //get script and arguments
        let $script = script;
        let $args = $script.Arguments;

        //get names of arguments
        let argNames = $args.map(arg => arg.name);
        if (argNames.length == 0) return;

        //create instance of mapping
        let argsMap = {};
        if (Array.isArray(args)) {
            for(let i = 0; i < argNames.length; i++) {
                argsMap[argNames[i]] = (i < args.length) ? args[i] : undefined;
            }
        }
        else {
            if (typeof(args) !== 'object') argsMap[argNames[0]] = (args) ? args : undefined;
            else {
                let keys = Object.keys(args);
                if (keys.length == 0)
                    argsMap[argNames[0]] = (args) ? args : undefined;
                else {

                    keys.forEach(name => {
                        if (!argsMap[name] == undefined) throw new Error(`Invalid argument name: ${name}`);
                        argsMap[name] = (args[name]) ? args[name] : undefined;
                    });
                }
            }
        }

        $args.forEach(arg => {
            let value = argsMap[arg.name];
            arg.value = (value === undefined) ? arg.default: value;
        });
    }

    checkArgs(script, args)
    {
        //get owner
        let that = (script.owner) ? script.owner : this;

        //get script and arguments
        let $script = script;
        let $args = $script.Arguments;

        Object.keys($args)
                .forEach(name => {
                    let arg = $args[name];
                    let isArray = (arg.type.indexOf('array') == 0) ? true : false;

                    if (isArray) {
                        let type = arg.type.substring('array'.length + 1, arg.type.length - 1) ;
                        arg.value == arg.value
                                        .map(value => that.checkArg(value, type, arg.range));
                    }
                    else {
                        arg.value = that.checkArg(arg.value, arg.type, arg.range);
                    }
        });
    }

    checkArg(value, type, range)
    {
        let result = undefined;
        let err = new Error(`not support type: ${type}, value: ${value}`);

        switch(type) {
            case "string":
                return value.toString();
            case "date":
            case "time":
            case "datetime":
                if (typeof(value) === 'Date')
                    result = value;
                else if (typeof(value) === 'number')
                    result = new Date(value);
                else if (typeof(value) === 'string'
                    || typeof(value) === 'object')
                    result = Date.parse(value);
                else throw err;

                return result;
            case "number":
            case "int":
            case "integer":
                if (typeof(value) === 'number')
                    result = value;
                else if (typeof(value) === 'string')
                    result = Number.parseInt(value);
                else throw err;

                return result;
            case "float":
            case "money":
                return Number.parseFloat(value);
            default:
                throw new Error(`not support type: ${type}`);
        }
    }

    generateArgs($script)
    {
        let args = {};
        let $args = $script.Arguments;

        $args.forEach(arg => args[arg.name] = arg.value);

        return args;
    }

    execute(args, callback)
    {
        let that = this;
        let $script = that.script;
        if (!args) args = [];args

        try{
            //declare script and arguments
            $script.owner = that;

            //process arguments
            that.initArgs($script);
            that.fillArgs($script, args);
            that.checkArgs($script, args);

            //post datas before invoke
            that.prePostData($script);

            //declare array of all functions
            let funcs = that.getParts($script)
                            .map(part => {part.owner = $script.owner; return part;})
                            .map(part => aq.call(that, that.executePart, part, Empty_Data));

            if (funcs.length == 0)  //return empty if there is no part
                that.resolveData($script, Empty_Data, callback);
            else {
                aq.parallel(funcs)  //execute parts one by one
                    .then(data => that.resolveData($script, that.unwrapData(data), callback))
                    .catch(err => that.rejectError($script, err, callback));    //catched error
            }
        }
        catch(err) {
            //catched the error
            that.rejectError($script, err, callback);
        }
    }

    executePart(part, data, callback)
    {
        let $part = part;
        let $data = data;
        let that = ($part.owner) ? $part.owner : this;

        try{
            that.prePostData($part);

            that.postBody(
                $part,
                $data,
                ((err, data) => {

                    //catch err if it exists
                    if (err)
                        that.rejectError(part, err, callback);  //catched error
                    else {

                        //generate execute functions
                        let funcs
                            = that.getParts($part)      //get parts in script
                                .map(part => {part.owner = $part.owner; return part;})
                                .map(part => aq.call(that, that.executePart, part, data));

                        if (funcs.length == 0)  //return current data if there is no child part.
                            that.resolveData($part, data, callback)
                        else aq.parallel(funcs) //merge result from parts one by one
                                .then(data => that.resolveData($part, that.unwrapData(data), callback))
                                .catch(err => that.rejectError($part, err, callback));  //catched error
                    }
                })
            );
        }
        catch(err) {
            //catch error
            that.rejectError($part, err, callback);
        }
    }

    getParts(parent)
    {
        let parts = (parent) ? ((parent.parts) ? parent.parts : []) : [];
        if (!Array.isArray(parts)) parts = [parts];

        return parts;
    }

    unwrapData(data)
    {
        if (Array.isArray(data)){
            if (data.length == 1) return data[0];
        }

        return data;
    }

    getContext(parent)
    {

        let that = (parent.owner) ? parent.owner : this;

        if (!that.script) that.script = {};
        if (!that.script.context) that.script.context = {};

        //get context from script
        let ctx = that.script.context;

        //process arguments
        if (!ctx.args) ctx.args = that.generateArgs(that.script);

        if (!ctx.global) ctx.global = {};

        //process headers, it will overwrite old items and always get headers from parent
        let headers = (parent.headers) ? parent.headers : {};
        if (typeof(headers) === 'function') headers = headers(ctx);

        ctx.headers = headers;

        return ctx;
    }

    prePostData(parent)
    {
        //get instance of owner
        let that = (parent.owner) ? parent.owner : this;

        //get context from parent
        let ctx = that.getContext(parent);

        //call before methods
        if (parent.before) parent.before(ctx);
    }

    postBody(part, data, callback)
    {
        let arg1 = 1;
        if (part == null) {
            return;
        }

        let that = (part.owner) ? part.owner : this;
        let $ctx = that.getContext(part);
        let $data = data;

        if (part.beforePost) part.beforePost($ctx, $data);

        let $body = (part.body) ? part.body : '';
        if(typeof($body) === 'function') {
            $body = $body($ctx, $data);
        }

        //post body
        let headers = $ctx.headers
        //console.log(headers);

        callback(null, $body);
    }

    resolveData(parent, data, callback)
    {

        let that = (parent.owner) ? parent.owner : this;

        let ctx = that.getContext(parent);

        if (parent.after) data = parent.after(ctx, data);

        callback(null, data);
    }

    rejectError(parent, err, callback)
    {
        if (!err) return;

        let that = (parent.owner) ? parent.owner : this;
        if (that.errors) that.errors.push(err);
        callback(err, null);
    }
}

module.exports = Engine;
