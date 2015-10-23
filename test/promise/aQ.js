'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');
let aq = require('../../').aq;
let fake = require('../../').fake;

let port = 1338;
let fakedHTTP = new fake.http(port);

describe('aq', () => {
    before(() => {
        fakedHTTP.start();
    })

    it('wrap value', done => {

        aq.Q(1)
            .then(data => {
                assert.equal(data, 1, 'test');
                done();
            })
            .catch(err => done(err));
    });

    it ('wrap function', done => {
        let dataFile = path.join(__dirname, 'test.dat');

        //read file from sync method
        let syncData = fs.readFileSync(dataFile, 'utf-8')

        //read file from async method
        aq.apply(fs, fs.readFile, [dataFile, 'utf-8'])
            .then(data => {
                assert.equal(data, syncData, 'compare file content failed.');
                done();
            })
            .catch(err => done(err));
    });

    it('wrap functions', () => {

        var fn = aq.wrap(function* (val) {

            assert.equal(val, 6, 'invaild val');

            let r = [];
            if (val >= 0) {
                for(let i = 0; i < val; i++){
                    let ri = yield aq.Q(i + 1);
                    r.push(ri);
                }
            }

            assert.deepEqual(r, [1, 2, 3, 4, 5, 6], 'Invaild length of return array.');

            return r;
        });

        return fn(6);
    });

    it('bind function', function(done){

        let f = function(flag, count) {

            for(let i = 0; i < count; i++ ) {
                let line = flag + ': ' + i.toString();
            }

            return count;
        }


        let f1 = f.bind(null, 'a', 5);
        let f2 = f.bind(null, 'b', 20);
        let f3 = f.bind(null, 'c', 10);

        aq.binds([f1, f2, f3])
            .then(data => {
                assert.deepEqual(data, [5, 20, 10], 'incorrect result for parallel mode.');
                done();
            })
            .catch(err => done(err));
    })

    it('parallel mode', function(done) {

        let q1 = [aq.Q(2), aq.Q(4), aq.Q(6)];
        aq.parallel(q1)
            .then(function(data) {
                assert.deepEqual(data, [2, 4, 6], 'incorrect result for parallel mode.')
                done();
            })
            .catch(err => done(err));
    });

    it('rest method', (done) => {
        let url = 'http://127.0.0.1:' + port + '/?key1=val1&key2=val2';
        aq.rest(url)
            .then(data => {
                let result = {"key1":"val1", "key2":"val2"};
                assert.deepEqual(data, result, "Get data from http server error!");
                done();
            })
            .catch(err => done(err));
    })

    after(() => {
        fakedHTTP.stop();
    })

});
