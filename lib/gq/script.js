'use strict';

const DefaultAction = "default";

let crypto = require('crypto');

class Script
{
    constructor() {
        this.version = '';
        this.hash = '';
        this.arguments = [];
        this.action = '';
        this.parts = [];
        this.context = {};
    }

    get Version(){
        return this.version;
    }

    get Action() {
        return this.action;
    }

    get Context() {
        return this.context;
    }

    get Arguments() {
        return this.arguments;
    }

    get Parts() {
        return this.parts;
    }

    before(ctx)
    {
    }

    after(ctx, datas)
    {
        return datas;
    }

    generateHash(data)
    {
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

class Argument
{
    constructor()
    {
        this.name = '';
        this.type = 'string';
        this.default = null;
        this.value = null;
    }

    get Name(){return this.name;}
    get Type(){return this.type;}
    get Default(){return this.default;}
    get Value(){return this.value;}
    set Value(value){this.value = value;}
}

class Part
{
    constructor()
    {
        this.action = DefaultAction;
        this.headers = {};
        this.body = '';
        this.parts = [];
    }

    get Headers(){return this.headers;}

    get Parts(){return this.parts;}

    get Action(){return this.action;}

    before(ctx) {}

    after(ctx, data) {
        return data;
    }
}

module.exports = (function() {
    return {
        "DefaultAction": DefaultAction,
        "Script": Script,
        "Argument": Argument,
        "Part": Part
    }
})();
