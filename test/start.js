'use strict';

require('../');
//console.log('hm: ' + harmonyMode);
//require('child_process').fork('test/conf/conf.js');
//require('child_process').fork('test/logger/log.js');

var testScripts = ['./conf/conf.js', './logger/log.js', './promise/aq.js', './gq/index.js'];

testScripts.forEach(function(script) {
    if (script.startsWith('#')) return;
    require(script);
});
