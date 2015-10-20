'use strict';

let fs = require('fs');
let path = require('path');
let ss = require('./script.js');

//eval
class Parser
{
    constructor(){}

    parseFile(scriptPath, callback) {

        let that = this;

        try{
            fs.readFile(scriptPath, {encoding: 'utf-8'}, function(err, data){
                if (err) callback(err, null);
                else {
                    //parse content
                    let sc = that.parseContent(data);

                    callback(null, sc);
                }
            });
        }
        catch(err){
            callback(err, null);
        }
    }

    parseFileSync(scriptPath) {

        let content = fs.readFileSync(scriptPath, {encoding: 'utf-8'});

        return this.parseContent(data);
    }

    parseContent(content) {

        let that = this;

        let sc = (eval("(function (){return " + content + "})()"));
        let $sc = new ss.Script()

        if (sc) {

            //parse metas
            $sc.type = (sc.type) ? sc.type : "query";
            $sc.version = (sc.version) ? sc.version : "1.0.0";
            $sc.hash = (sc.hash) ? sc.hash : $sc.generateHash(content);

            //parse cache policy
            if (sc.cache) {
                $sc.cache = sc.cache;
            }

            //parse arguments in script
            if (sc.arguments) {

                Object.keys(sc.arguments).forEach(
                    function(key) {
                        let $arg = that.parseArgument(key, sc.arguments[key]);

                        $sc.arguments.push($arg);
                    }
                )
            }

            //parse parts in script
            if (sc.parts) {

                if (Array.isArray(sc.parts)){

                    sc.parts.forEach(function(part) {
                        that.parsePart($sc, $sc.parts, part)
                    });
                }
                else that.parsePart($sc, $sc.parts, sc.parts)
            }

            //parse script-scope function
            if (sc.beforeEach){
                $sc.beforeEach = sc.beforeEach;
            }

            if (sc.afterEach){
                $sc.afterEach = sc.afterEach;
            }
        }

        return $sc;
    }

    parseArgument(key, arg) {
        let $arg = new ss.Argument();

        $arg.name = key;
        $arg.type = (arg.type) ? arg.type : ((arg) ? arg : "string");
        $arg.default = (arg.default) ? arg.default : undefined;

        return $arg;
    }

    parsePart(owner, parent, part) {
        let that = this;
        let $part = new ss.Part();

        //console.log(part.toString());
        $part.hash = (part.hash) ? part.hash : owner.generateHash(JSON.stringify(part));

        //parse cache policy
        if (part.cache) {
            $part.cache = part.cache;
        }

        if (part.headers) {
            Object.keys(part.headers)
                .forEach(function(header) {
                    $part.headers[header] = part.headers[header];
                })
        }

        //parse body
        if (part.body) {
            $part.body = part.body;
        }

        //parse children parts if it exists.
        if (part.parts) {
            if (Array.isArray(part.parts)) {

                part.parts.forEach(function(part) {
                    that.parsePart(owner, $part.parts, part)
                });
            }
            else that.parsePart(onwer, $part.parts, part.parts)
        }

        //parse functions in part scope
        if (part.before) $part.before = part.before;
        if (part.after) $part.after = part.after;

        if (parent && Array.isArray(parent)) {
            parent.push($part);
        }
    }
}

module.exports = Parser;
