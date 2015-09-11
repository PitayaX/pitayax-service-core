'use strict';

let ConfigMap = require('../lib').ConfigMap;
//let ConfigMap = require('../lib/conf').ConfigMap;

//console.log('d: ' + d);

let path = require('path');
let fs = require('fs');

//console.log(ConfigMap.__proto__);

let m1 = new Map();
m1.set('tt', 1).set('tt2', 3);


let cf = new ConfigMap();
cf.set('tt', 1).set('t2', 33);
console.log(cf.toJSON());

//get full file path for configuration
let configFile = path.join(__dirname, 'config.json');

//parse config json to an object
let config = ConfigMap.parseJSON(fs.readFileSync(configFile, { encoding: 'utf-8' }));

console.log ('json config:' + config.toJSON(true));
