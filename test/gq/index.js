'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');

let gq = require('../../').gq;
let Parser = gq.Parser;
let Engine = gq.Engine;

describe('gq', function() {



    it('test parser', function(done) {

        let scfile = path.join(__dirname, 'test-qb.js');
        let parser = new Parser();

        parser.parseFile(scfile, function(err, data) {
            if (err){
                console.log(err);
            }
            else {
                //if (data.beforeEach) data.beforeEach(data.arguments);
                //console.log(data);
            }
            done();
        })
    })

    it('test engine', function(done) {

        let scfile = path.join(__dirname, 'test-qb.js');
        let parser = new Parser();

        parser.parseFile(scfile, function(err, data) {
            if (err){
                console.log(err);
            }
            else {
                let engine = new Engine(data);
                engine.execute([1, 2], function(err, data) {
                    if (err){
                        console.log('err: ' + err.message);
                    }
                    else{
                        console.log('r: ' + JSON.stringify(data));
                    }
                });
                //if (data.beforeEach) data.beforeEach(data.arguments);
                //console.log(data);
            }
            done();
        })
    })
})
