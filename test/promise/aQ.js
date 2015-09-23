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
    //co.thunk
    return yield [Promise.resolve('t1'), Promise.resolve('t2'), Promise.resolve('t3')];
});

fn2('test')
    .then(function(val){
        console.log(val);
    })

aQ.invoke(fs.readFile, [dataFile2, 'utf-8'])
    .then(function(data){
        console.log('read file');
        console.log(data);
    })

aQ.oneByOne([Promise.resolve('t1'), Promise.resolve('t2'), Promise.resolve('t3')])
    .then(function(result) {
        result.forEach(function(a){
            console.log(a);
        })
    })

aQ.rest('http://10.10.73.207:8088/api/post/list')
    .then(function(data){
        console.log(data);
    })
