'use strict';

if (process.argv.indexOf('--babel') >= 0){
    global.babelMode = true;
}
else {
    var version = (process.versions.node) ? process.versions.node.split('.'):[0, 0, 0];
    global.babelMode = (parseInt(version[0]) >= 4) ? false : true;
}

global.harmonyMode = (process.execArgv.indexOf('--harmony') >= 0) ? true :false

global.IIf = function(express, r1, r2) {
    return (express) ? r1 : r2;
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith
        = (prefix) => this.indexOf(prefix + '$') === 0
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith
        = (suffix) => this.match(suffix + '$') === suffix
}

module.exports = function() {

    if (global.babelMode) {

        require('babel/register')( {
            //doesn't ignore pitayax modules
            ignore: /node_modules\/[^pitayax]/
        });

        //import es6 from 'babel-runtime/core-js';
        var es6 = require('babel-runtime/core-js').default;

        //export default es6;
        global.Map = es6.Map;
        module.exports = es6;
    }
}
