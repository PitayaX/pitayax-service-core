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
        Object.keys(script.Arguments)
            .forEach(key => {
                let arg = script.Arguments[key];

                if (!arg.type) arg.type = 'string';
                if (!arg.default) {
                    switch(arg.type) {
                        case 'string':
                            arg.default = '';
                            break;
                        case 'number':
                        case 'float':
                        case 'int':
                        case 'double':
                        case 'money':
                            arg.default = 0;
                            break;
                        default:
                            throw new Error("Doesn't support type:" + arg.type);
                    }
                }
            });
    }

    fillArgs(script, args)
    {
        let that = (script.owner) ? script.owner : this;

        let $script = script;
        let $args = $script.Arguments;

        let argNames = $args.map(arg => arg.name);

        let argsMap = {};
        if (Array.isArray(args)) {
            for(let i = 0; i < argNames.length; i++) {
                argsMap[argNames[i]] = (i < args.length) ? args[i] : undefined;
            }
        }

        $args.forEach(arg => {
            let value = argsMap[arg.name];
            arg.value = (value === undefined) ? arg.default: value;
        });
    }

    fillArg(arg, value)
    {
        switch(arg.type) {
            case "string":
                arg.value = (value === undefined) ? arg.value = arg.default: value;
            default:
                break;
        }
    }

    checkArguments()
    {
        let that = this;

        let keys = Object.keys(that.script.Arguments);

        for(let i = 0; i < keys.length; i++) {
             let $arg = that.script.Arguments[keys[i]];
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

        try{
            //declare script and arguments
            $script.owner = that;

            //process arguments
            that.initArgs($script);
            that.fillArgs($script, args);
            that.checkArguments();

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
                    .then(data => that.resolveData($script, data, callback))
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

        //process headers, it will overwrite old items and always get headers from parent
        ctx.headers = (parent.headers) ? parent.headers : {};

        return ctx;
    }

    prePostData(parent)
    {
        //get instance of owner
        let that = (parent.owner) ? parent.owner : this;

        //get context from parent
        let ctx = that.getContext(parent);

        //call before methods
        if (parent.beforeEach) parent.beforeEach(ctx);
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

        let $body = part.body;
        if(typeof($body) === 'function'){
            $body = $body($ctx, data);
        }

        callback(null, $body);
    }


    resolveData(parent, data, callback)
    {

        let that = (parent.owner) ? parent.owner : this;

        let ctx = that.getContext(parent);

        if (parent.after) data = parent.after(ctx, data);
        if (parent.afterEach) data = parent.afterEach(ctx, data);

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
