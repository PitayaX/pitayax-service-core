'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');
let aq = require('../../').aq;
let gq = require('../../').gq;
let fake = require('../../').fake;

let Parser = gq.Parser;
let Engine = gq.Engine;

let port = 1340;
let fakedHTTP = new fake.http(port);

let testScript = function(script, args)
{

    let scriptFile = path.join(__dirname, script);
    let scriptArgs = ((args) ? args : []);
    let conf = {"Conf": {"port": port}};

    return (
        Parser.parse(scriptFile)
            .then(script => Engine.invoke(script, scriptArgs, conf))
        )
}

describe('gq', function() {
    before(() => {
        fakedHTTP.start();
    })

    it('test parse', function(done) {

        Parser.parse(path.join(__dirname, 'test_script1.js'))
            .then(script => {

                let args = script.Arguments;
                let argNames = args.map(arg => arg.name);
                let argTypes = args.map(arg => arg.type);
                let parts = script.Parts;

                //parse arguments name
                assert.deepEqual(argNames, ["arg1", "arg2"], "parse arguments name failed");

                //parse arguments type
                assert.deepEqual(argTypes, ["string", "number"], "parse arguments type failed");

                //parse parts
                assert.equal(parts.length, 1, "parse parts failed");

                //end test
                done();
            })
            .catch(err => done(err))
    })

    it('test parse bad file', function(done) {

        Parser.parse(path.join(__dirname, 'test_script_err.js'))
            .then(script => done(new Error('Can\'t get error parsing bad file.')))
            .catch(err => {
                assert.throws(() => {throw err;}, "parse bad script file");
                done();
            })
    })


    it('test empty script', function(done) {

        let result = {};

        testScript('test_script_empty.js')
            .then(data => aq.Q(assert.deepEqual(result, data, 'failed test for script 1')))
            .then(() => done())
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

    it('test rest script', function(done) {

        let result = [{"data1":"val1"}, {"data2":"val2"}, {"data3":"val3"}];
        let result2 = [{"data1":"val1"}, {"data2":"val2"}, {"data3":"val3"}];
        let result3 = [{"data1":"val1"}, {"data2":"val2"}, [{"data4":"val4"}, {"data5":"val5"}]];

        testScript('test_script_rest.js')
            .then(data => assert.deepEqual(result, data, 'failed test for rest script'))
            .then(() => testScript('test_script_rest2.js'))
            .then(data => assert.deepEqual(result2, data, 'failed test for rest script2'))
            .then(() => testScript('test_script_rest3.js'))
            .then(data => assert.deepEqual(result3, data, 'failed test for rest script3'))
            .then(() => done())
            .catch(err => done(err));
    })

    after(() => {
        fakedHTTP.stop();
    })
})
