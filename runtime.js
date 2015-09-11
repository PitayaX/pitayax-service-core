'use strict';

global.harmonyMode = (process.execArgv.indexOf('--harmony') >= 0) ? true :false

console.log(((harmonyMode)?'harmony':'babel') + ' mode');

global.IIf = (express, r1, r2) => {
    return (express) ? r1 : r2;
}

module.exports = function(script){

    if (script){
        if (harmonyMode){
            require('child_process').fork(script);
            module.exports = global;
        }
        else {
            require('babel/register');

            //import es6 from 'babel-runtime/core-js';
            var es6 = require('babel-runtime/core-js').default;

            //export default es6;
            global.Map = es6.Map;
            module.exports = es6;

            require(script);
        }
    }
}
