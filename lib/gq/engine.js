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

    fillArgumsnts(args)
    {
        let that = this;
        let $arg = that.Arguments;
    }

    checkArguments()
    {
        let that = this;

        let keys = Object.keys(that.script.Arguments);

        for(let i = 0; i < keys.length; i++) {
             let $arg = that.script.Arguments[keys[i]];
        }
    }

    generateArguments()
    {
        let that = this;

        Object.keys(that.script.Arguments)
            .forEach(function(arg) {
                //that.args.push((arg.value) ? arg.value : undefined);
            });
    }

    execute(args, callback)
    {
        let that = this;
        let $script = that.script;

        try{
            //declare script and arguments
            $script.owner = that;

            //process arguments
            that.fillArgumsnts(args);
            that.checkArguments();

            //post datas before invoke
            that.prePostData($script);

            //declare array of all functions
            let funcs = that.getParts($script)
                            .map(part => {part.owner = $script.owner; return part;})
                            .map(part => aq.call(that.executePart, part, Empty_Data));

            if (funcs.length == 0)  //return empty if there is no part
                that.resolveData($script, Empty_Data, callback);
            else {
                aq.parallel(funcs)  //execute parts one by one
                    .then(data => that.resolveData($script, data, callback))
                    .catch(err => that.rejectError($script, err, callback));    //catched error
            }
        }
        catch(err){
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

            that.executeBody(
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
                                .map(part => aq.call(that.executePart, part, data));

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

    executeBody(part, data, callback)
    {
        let arg1 = 1;
        if (part == null) {
            console.log('t');
            return;
        }

        let that = (part.owner) ? part.owner : this;
        let $body = part.body;
        let $ctx = that.getContext(part);

        callback(null, $body);
    }

    getParts(parent) {
        let parts = (parent) ? ((parent.parts) ? parent.parts : []) : [];
        if (!Array.isArray(parts)) parts = [parts];

        return parts;
    }

    unwrapData(data){
        if (Array.isArray(data)){
            if (data.length == 1) return data[0];
        }

        return data;
    }

    getContext(parent) {

        let that = (parent.owner) ? parent.owner : this;
        //console.log(parent);

        if (!that.script) that.script = {};
        if (!that.script.context) that.script.context = {};

        //get context from script
        let ctx = that.script.context;

        //process arguments
        if (!ctx.arguments) ctx.arguments = that.generateArguments();

        //process headers, it will overwrite old items and always get headers from parent
        ctx.headers = (parent.headers) ? parent.headers : {};

        return ctx;
    }

    prePostData(parent) {
        //get instance of owner
        let that = (parent.owner) ? parent.owner : this;

        //get context from parent
        let ctx = that.getContext(parent);

        //call before methods
        if (parent.beforeEach) parent.beforeEach(ctx);
        if (parent.before) parent.before(ctx);
    }

    resolveData(parent, data, callback) {

        let that = (parent.owner) ? parent.owner : this;

        let ctx = that.getContext(parent);

        if (parent.after) data = parent.after(ctx, data);
        if (parent.afterEach) data = parent.afterEach(ctx, data);

        callback(null, data);
    }

    rejectError(parent, err, callback) {
        if (!err) return;

        let that = (parent.owner) ? parent.owner : this;
        if (that.errors) that.errors.push(err);
        callback(err, null);
    }
}

module.exports = Engine;
