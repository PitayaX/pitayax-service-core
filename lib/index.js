'use strict';

let adapter = {};
let folders = ['./conf', './logger'];

folders.forEach(function(folder) {
    let lib = require(folder);
    
    Object
        .keys(lib)
        .forEach(function(key) {
            adapter[key] = lib[key];
    })
})

module.exports = adapter;
