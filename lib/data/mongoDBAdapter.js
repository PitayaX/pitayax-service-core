'use strict';

let DbAdapter = require('./dbAdapter.js');

class MongoDBAdapter extends DbAdapter
{
    constructor()
    {
        super();
    }
}

module.exports = MongoDBAdapter;
