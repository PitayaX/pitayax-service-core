'use strict';
//require('script')

let aq = require('../promise/aq.js');

class Engine
{
    constructor(script)
    {
        this.script = script;
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
                that.args.push((arg.value) ? arg.value : undefined);
            });
    }

    execute(args, callback)
    {
        let that = this;
        let ctx = this.script.context;

        try{
            //process arguments
            that.fillArgumsnts(args);
            that.checkArguments();
            that.generateArguments();

            //declare script and arguments
            let $$ = that.script;
            let $args = that.script.Arguments;

            if ($$.beforeEach){
                $args = $$.beforeEach(ctx, $args);
            }

            //declare array of all functions
            let funcs = [];

            if (Array.isArray($$.parts)) {
                $$.parts.forEach(function($part) {
                    funcs.push(aq.apply(that.executePart, [that, $part, null]));
                })
            }
            else {
                funcs.push(aq.apply(that.executePart, [that, $$.parts, null]));
            }

            if (funcs.length > 0) {

                aq.parallel(funcs)
                    .then(function(data) {

                        if (funcs.length === 1) data = data[0];

                        //process data after all parts have finished
                        if ($$.afterEach) {
                            data = $$.afterEach(ctx, data);
                        }

                        console.log('a:' + JSON.stringify(data));

                        callback(null, data);
                    })
                    .catch(function(err) {

                        //push error
                        that.errors.push(err);

                        callback(err, null);
                    });
            }
            else callback(null, []);

        }
        catch(err){
            callback(err, null);
        }
    }

    executePart(that, part, data, callback)
    {
        let ctx = that.script.context;

        try{

            if (part.before) {
                part.before(ctx, that.args);
            }

            that.executeBody(ctx, part.body, data, function(err, data) {

                if (err) {
                    callback(err, null);
                }
                else {
                    if (part.parts && part.parts.length > 0) {

                        let funcs = [];

                        part.parts.forEach(function(subPart) {

                            funcs.push(aq.apply(that.executePart, [that, subPart, data]));
                        });

                        aq.parallel(funcs)
                            .then(function(data) {

                                //console.log('d: ' + data);
                                if (funcs.length === 1) {
                                    data = data[0];
                                }

                                //call after method to process data
                                if (part.after) data = part.after(ctx, data);

                                //return data;
                                callback(null, data);
                            })
                            .catch(function(err) {
                                //catched error
                                that.errors.push(err);
                                callback(err, data);
                            });
                    }
                    else {
                        //call after method to process data
                        if (part.after) data = part.after(ctx, data);

                        //return data;
                        callback(null, data);
                    }
                }
            });
        }
        catch(err){
            that.errors.push(err);
            callback(err, null);
        }
    }

    executeBody(that, body, data, callback)
    {
        callback(null, body);
    }
}

module.exports = Engine;
