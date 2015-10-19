'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');
let se = require('../../');

describe('se', function() {
    it('test one', function(done) {
        let scfile = path.join(__dirname, 'test-qb.js');
        let parser = new se.Parser();
        parser.parseFile(scfile, function(err, data) {
            if (err){
                console.log(err);
            }
            else {
                //if (data.beforeEach) data.beforeEach(data.arguments);
                console.log(data);
            }
            done();
        })
    })
})
