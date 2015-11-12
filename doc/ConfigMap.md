## ConfigMap
The class ConfigMap can parse JSON or YAML format configuration file to a Map instance.

``` javascript
'use strict';

let ConfigMap = require('pitayax-service-core').ConfigMap;

//get full file path and parse it for YAML format
let configFile = path.join(__dirname, 'config.yml');
let config = ConfigMap.parseYAML(fs.readFileSync(configFile, { encoding: 'utf-8' }));

console.log(config.get('name'))  //test file

let databases = config.get('databases');
if (databases.has('dbtest')){
    console.log(databases.get('dbtest'))  //connection string for test
}    //

```

> The content of config.yml

``` Yaml
---
$$version:  "1.0.1"
name:  test file
databases:
    dbtest:  connection string for test
    dbsys:  connection string for system

...
```
