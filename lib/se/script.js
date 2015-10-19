'use strict';

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
        this.part = [];
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
