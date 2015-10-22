'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');
let aq = require('../../').aq;

let gq = require('../../').gq;
let Parser = gq.Parser;
let Engine = gq.Engine;

let testScript = function(script, args)
{
    return new Promise((resolve, reject) => {

        let scriptFile = path.join(__dirname, script);
        let parser = new Parser();

        aq.call(parser, parser.parseFile, scriptFile)
            .then(data => {
                let engine = new Engine(data);
                return aq.call(engine, engine.execute, args);
            })
            .then(data => resolve(data))
            .catch(err => reject(err))
    });
}

describe('gq', function() {

    it('test parser', function(done) {

        //create instance of parser
        let parser = new Parser();
        aq.call(parser, parser.parseFile, path.join(__dirname, 'test_script1.js'))
            .then(data => {

                let args = data.Arguments;
                let argNames = args.map(arg => arg.name);
                let argTypes = args.map(arg => arg.type);
                let parts = data.Parts;

                assert.deepEqual(argNames, ["arg1", "arg2"], "parse arguments name failed");
                assert.deepEqual(argTypes, ["string", "number"], "parse arguments type failed");
                assert.equal(parts.length, 1, "parse parts failed");

                done();
            })
            .catch(err => {done(err);})
    })

    it('test script1', function(done) {

        let result = [{"result":"t", "data":"arg1 test"}];
        testScript('test_script1.js', ['arg1 test', 2])
            .then(data => {
                assert.deepEqual(result, data, 'failed test for script 1');
                done();
            })
            .catch(err => done(err));
    })

    it.skip('test script2', function(done) {

        let result = [{"result":"t", "data":"arg1 test"}];
        testScript('test_script1.js', ['arg1 test', 2])
            .then(data => {
                assert.deepEqual(result, data, 'failed test for script 1');
                done();
            })
            .catch(err => done(err));
    })

    it.skip('test script3', function(done) {

        let result = [{"result":"t", "data":"arg1 test"}];
        testScript('test_script1.js', ['arg1 test', 2])
            .then(data => {
                assert.deepEqual(result, data, 'failed test for script 1');
                done();
            })
            .catch(err => done(err));
    })
})
