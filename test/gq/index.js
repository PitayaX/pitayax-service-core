'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');
let aq = require('../../').aq;
let gq = require('../../').gq;
let fake = require('../../').fake;

let Parser = gq.Parser;
let Engine = gq.Engine;

let port = 1339;
let fakedHTTP = new fake.http(port);

let testScript = function(script, args)
{
    return new Promise((resolve, reject) => {

        let scriptFile = path.join(__dirname, script);
        let parser = new Parser();

        aq.call(parser, parser.parseFile, scriptFile)
            .then(data => {
                let engine = new Engine(data);
                return aq.call(engine, engine.execute, (args)?args:[]);
            })
            .then(data => resolve(data))
            .catch(err => reject(err))
    });
}

describe('gq', function() {
    before(() => {
        fakedHTTP.start();
    })

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

    it('test script1 - one part with two args', function(done) {

        let result = {"result":"t", "data":"arg1 test"};
        testScript('test_script1.js', ['arg1 test', 2])
            .then(data => {
                assert.deepEqual(result, data, 'failed test for script 1');
                done();
            })
            .catch(err => done(err));
    })

    it('test script2 - three parts without arg', function(done) {

        let result = [{"data":"result1"}, {"data":"result2"}, {"data":"result3"}];
        testScript('test_script2.js')
            .then(data => {
                assert.deepEqual(result, data, 'failed test for script 2');
                done();
            })
            .catch(err => done(err));
    })

    it('test script3 - test headers', function(done) {

        let arg1 = 30;
        let result = { "col1": arg1, "col2": "hh2", "col3": "v3" };

        testScript('test_script3.js', [arg1])
            .then(data => {
                assert.deepEqual(result, data, 'failed test for script 3 step1');
                done()
            })
            .catch(err => done(err));
    })

    it('test script4 - complex arguments', function(done) {

        let result = {"arg1": Date.parse("08/08/2015"), "arg2":["a", "b", "c"], "result": "t"};
        testScript('test_script4.js', ["08/08/2015", ["a", "b", "c"]])
            .then(data => {
                assert.deepEqual(result, data, 'failed test for script 4 step 1');
                done();
            })
            .catch(err => done(err));
    })

    it('test script args - input arguments', function(done) {

        testScript('test_script_args.js', ['static', undefined, 3])
            .then(data => {
                let result = {"data1": "static", "data2": "fixed", "data3": 3};
                assert.deepEqual(result, data, 'failed test for script with arguments step 1');

                return testScript('test_script_args.js', 'val1');
            })
            .then(data => {
                let result = {"data1": "val1", "data2": "fixed", "data3": 0};
                assert.deepEqual(result, data, 'failed test for script with arguments step 2');

                return testScript('test_script_args.js', ['val1']);
            })
            .then(data => {
                let result = {"data1": "val1", "data2": "fixed", "data3": 0};
                assert.deepEqual(result, data, 'failed test for script with arguments step 3');

                return testScript('test_script_args.js', {'arg1':'val1', 'arg3': 6});
            })
            .then(data => {
                let result = {"data1": "val1", "data2": "fixed", "data3": 6};
                assert.deepEqual(result, data, 'failed test for script with arguments step 4');

                return aq.Q(0);
            })
            .then(data => done())
            .catch(err => done(err));
    })

    after(() => {
        fakedHTTP.stop();
    })
})
