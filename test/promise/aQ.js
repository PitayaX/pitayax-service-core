'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');
let aQ = require('../../').aQ;

describe('aQ', function() {
    it('wrap value', function(done) {

        aQ.Q(1)
            .then(function(data) {
                assert.equal(data, 1, 'test');
                done();
        })
    });

    it ('wrap function', function(done) {
        let dataFile = path.join(__dirname, 'test.dat');

        //read file from sync method
        let syncData = fs.readFileSync(dataFile, 'utf-8')

        //read file from async method
        aQ.apply(fs.readFile, [dataFile, 'utf-8'])
            .then(function(data) {
                assert.equal(data, syncData, 'compare file content failed.');
                done();
        });
    });

    it('wrap functions', function() {

        var fn = aQ.wrap(function* (val) {

            assert.equal(val, 6, 'invaild val');

            let r = [];
            if (val >= 0) {
                for(let i = 0; i < val; i++){

                    let ri = yield aQ.Q(i + 1);
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
                //console.log(line);
            }

            return count;
        }


        let f1 = f.bind(this, 'a', 5);
        let f2 = f.bind(this, 'b', 20);
        let f3 = f.bind(this, 'c', 10);

        aQ.binds([f1, f2, f3]).then(function (data) {
            assert.deepEqual(data, [5, 20, 10], 'incorrect result for parallel mode.');
            done();
        });
    })

    it('parallel mode', function(done) {

        let q1 = [aQ.Q(2), aQ.Q(4), aQ.Q(6)];
        aQ.parallel(q1).then(function(data) {
            assert.deepEqual(data, [2, 4, 6], 'incorrect result for parallel mode.')
            done();
        })
    });
});

/*
aQ.rest('http://10.10.73.207:8088/api/post/list')
    .then(function(data) {
        //console.log('get rest data');
        //console.log(data);
    })
    */
