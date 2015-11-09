## aq
The aq object inherits from co, it includes all features in co and wrap request. You can use it easy to call rest service in server side
- https://github.com/tj/co
- https://github.com/request/request

aq.Q() method, package a value or error to a Promise
``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.Q(1)
 .then( data => console.log(data) ) //1

aq.Q(null, new Error('an error'))

```

aq.apply() method, call a function and get a Promise, the parameter is an array

``` javascript

let filename = 'data.txt'

aq.apply(fs, fs.readFile, [filename, 'utf-8'])
    .then( data => console.log(data) )  //output file data
    .catch( err => console.log(err) )
```

aq.call() method, call a function and get a Promise, the parameter is following the function

``` javascript

let filename = 'data.txt'

aq.call(fs, fs.readFile, filename, 'utf-8')
    .then( data => console.log(data) )  //output file data
    .catch( err => console.log(err) )
```


aq.rest() method, call a rest service and get a Promise

``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.rest('http://127.0.0.1:8000?key1=data1&key2=data2')
 .then( data => console.log(data) )   //{"key1":"data1", "key2":"data2"}

const headers = {"token": "xcvsd23sfs23423"}
const body = {"a1":1, "a2":2}

aq.rest('http://127.0.0.1:8000?key1=data1&key2=data2', 'POST', headers, body)
 .then( data => console.log(data) )   //return result
```

aq.parallel() method, can execute many Promise at the same time and get an array result

``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.parallel([aq.Q(1), aq.Q(2), aq.Q(3)])
 .then( data => console.log(data) )   //[1, 2, 3]

```

We can complex aq.rest and aq.parallel to batch process a few rest service.

``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.parallel([
  aq.rest('http://127.0.0.1:8000?key1=data1&key2=data2'),
  aq.rest('http://127.0.0.1:8000?key3=data3&key4=data4')
])
 .then( data => console.log(data) )   

//[{"key1":"data1", "key2":"data2"}, {"key3":"data3", "key4":"data4"}]

```

aq.series() method, execute a few Promise one by one and get the result for the latest one
``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.series([aq.Q(1), aq.Q(2), aq.Q(3)])
 .then( data => console.log(data) )   //3

```

aq.readFile() method, read a file and return a Promise
``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

let filename = 'data.txt'

aq.readFile(filename, 'utf-8')
 .then( data => console.log(data) )   //output file data

```
