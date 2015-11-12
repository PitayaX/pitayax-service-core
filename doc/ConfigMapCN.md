## ConfigMap
ConfigMap类可以用于解析JSON或者YAML格式的配置文件成一个Map对象，并拥有一些属于它自己的功能函数。

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

> config.yml 内容如下

``` Yaml
---
$$version:  "1.0.1"
name:  test file
databases:
    dbtest:  connection string for test
    dbsys:  connection string for system

...
```
