'use strict';

let fs = require('fs');
let path = require('path');
var crypto = require('crypto');
let ss = require('./script.js');

//eval
class Parser
{
    constructor()
    {
        //super();
    }

    parseFile(scriptPath, callback) {

        let that = this;

        try{
            fs.readFile(scriptPath, {encoding: 'utf-8'}, function(err, data){
                if (err) callback(err, null);
                else {
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

        if (sc){

            //parse metas
            $sc.type = (sc.type) ? sc.type : "query";
            $sc.version = (sc.version) ? sc.version : "1.0.0";
            $sc.hash = (sc.hash) ? sc.hash : that.generateHash(content);

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
                        let $part = that.parsePart(part)    ;
                        $sc.parts.push($part);
                    });
                }
                else {
                    $sc.parts.push(that.parsePart(part))
                }
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
        $arg.type = (arg.type) ? arg.type:"string";
        $arg.default = (arg.default) ? arg.default: arg;

        return $arg;
    }

    parsePart(part) {
        let $part = new ss.Part();

        if (part.before) $part.before = part.before;

        if (part.headers) {
            Object.keys(part.headers)
                .forEach(function(header) {
                    $part.headers[header] = part.headers[header];
                })
        }

        if (part.body) {
            $part.body = part.body;
        }

        if (part.after) $part.after = part.after;

        return $part;
    }

    generateHash(data) {

        let hashs = ['sha384', 'md5', 'sha256']
        for(let i = 0; i < hashs.length; i++) {
            let hash = crypto.createHash(hashs[i]);
            hash.update(data);
            data = hash.digest('base64');
        }

        if (data.lastIndexOf('==') == data.length - 2){
            data = data.substring(0, data.length - 2);
        }

        return data;
    }
}

module.exports = Parser;
