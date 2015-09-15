'use strict';

let adapter = {};
let folders = ['./conf/conf', './logger/logger'];

folders.forEach(function(folder) {
    if (folder.startsWith('#')) return;
    let lib = require(folder);

    adapter[lib.name] = lib;
})

module.exports = adapter;
