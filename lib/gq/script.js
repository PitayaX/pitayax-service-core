'use strict';

let crypto = require('crypto');

class Script
{
    constructor() {
        this.type = '';
        this.version = '';
        this.hash = '';
        this.arguments = [];
        this.parts = [];
    }

    get Arguments(){
        return this.arguments;
    }

    get Parts(){
        return this.parts;
    }

    beforeEach(args)
    {
        return args;
    }

    afterEach(datas)
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
        this.headers = {};
        this.body = '';
        this.parts = [];
    }

    before(args) {
        return args;
    }

    after(data) {
        return data;
    }
}

module.exports = (function() {
    return {
        "Script": Script,
        "Argument": Argument,
        "Part": Part
    }
})();
