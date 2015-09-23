'use strict';

let adapter = {};
let folders = ['./conf/conf', './logger/logger', './promise/aQ.js'];

folders.forEach(function(folder) {
    if (folder.startsWith('#')) return;
    let lib = require(folder);

    adapter[lib.name] = lib;
})

module.exports = adapter;
