'use strict';

let adapter = {};
let folders = ['./conf/conf.js', './data/index.js', './fake/index.js', './gq/index.js', './logger/logger.js', './promise/aq.js'];

folders.forEach(function(folder) {
    if (folder.startsWith('#')) return;
    let lib = require(folder);

    adapter[lib.name] = lib;
})

module.exports = adapter;
