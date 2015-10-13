'use strict';

let path = require('path');
let fs = require('fs');
let aQ = require('../../').aQ;

let dataFile = path.join(__dirname, 'data.json');
let dataFile2 = path.join(__dirname, 'data2.json');

var fn = aQ.wrap(function* (val) {
    //co.thunk
    let f1 = yield aQ.readFile(dataFile, 'utf-8');
    let f2 = yield aQ.readFile(dataFile2, 'utf-8');

    return [f1, f2];
});

var fn2 = aQ.wrap(function* (val) {
    return yield [Promise.resolve('t1'), Promise.resolve('t2'), Promise.resolve('t3')];
});

/*
fn2('test')
    .then(function(val) {
        console.log('fn2: ' + JSON.stringify(val));
    })
    */

let data1, data2;

aQ.readFile(dataFile2, 'utf-8')
    .then(function(data){
        data1 = data;
    })

/*
aQ.oneByOne([
                aQ.readFile(dataFile2, 'utf-8'),
                aQ.apply(fs.readFile, [dataFile2, 'utf-8'])
            ])
    .then(function(result) {
        console.log('length: ' + result.length);
    });
    */

    let f1 = function(flag, count) {
        console.log('start ' + flag);
        for(let i = 0; i < count; i++) {
            console.log(flag + '2:' + i);
        }
        console.log('end ' + flag);
    }

    let f2 = function(flag, count, callback) {
        console.log('start ' + flag);

        try{
            for(let i = 0; i < count; i++) {
                console.log(flag + ':' + i);
            }

            callback(null, count);
        }
        catch(err){
            callback(err, null);
        }
    }

//let queues1 = [aQ.invoke(f1, ['a', 20]), aQ.invoke(f1, ['b', 15]), aQ.invoke(f1, ['c', 10])];
//let queues2 = [aQ.apply(f2, ['a', 20]), aQ.apply(f2, ['b', 15]), aQ.apply(f2, ['c', 10])];
let queues3 = [
                aQ.readFile(dataFile2, 'utf-8').then(function(data){console.log('aa1'); return Promise.resolve('t1');}),
                aQ.readFile(dataFile, 'utf-8').then(function(data){console.log('bb2'); return Promise.resolve('tt2');}),
                aQ.readFile(dataFile2, 'utf-8').then(function(data){console.log('cc3'); return Promise.resolve('ttt3')})
            ];

console.log('Ready for parallel test');
aQ.oneByOne(queues3);

/*
    .then(function(data) {
        console.log(data);

        data.forEach(function(d) {
            console.log(d.length);
        });

        console.log('Finished test!');
    });
    */


aQ.rest('http://10.10.73.207:8088/api/post/list')
    .then(function(data) {
        //console.log('get rest data');
        //console.log(data);
    })
