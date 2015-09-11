'use strict';

let ConfigMap = require('../../').ConfigMap;
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
console.log('');

//get full file path for configuration
let configFile = path.join(__dirname, 'config.json');

//parse config json to an object
let config = ConfigMap.parseJSON(fs.readFileSync(configFile, { encoding: 'utf-8' }));

console.log ('json config:' + config.toJSON(true));

let databases = config.get('databases');
if (databases) {
    for(let item of databases){
        console.log(`key: ${item[0]}, cs:${item[1]}`);
    }
}

let configYamlFile = path.join(__dirname, 'config.yml');
let configYaml = ConfigMap.parseYAML(fs.readFileSync(configYamlFile, { encoding: 'utf-8' }));

console.log(configYaml.toJSON(false));
console.log('port:' + configYaml.Settings['port']);
