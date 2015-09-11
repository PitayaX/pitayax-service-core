'use strict';

let adapter = {};
let conf = require('./conf');

Object
    .keys(conf)
    .forEach(function(key) {
        adapter[key] = conf[key];
})

module.exports = adapter;
