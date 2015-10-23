'use strict';

let adapter = {};
let folders = ['./conf/conf.js', './logger/logger.js', './promise/aq.js', './gq/index.js', './fake/index.js'];

folders.forEach(function(folder) {
    if (folder.startsWith('#')) return;
    let lib = require(folder);

    adapter[lib.name] = lib;
})

module.exports = adapter;
