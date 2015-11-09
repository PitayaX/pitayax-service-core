## aq
aq对象继承自co，具有co的所有功能，并且封装了request对象，可以方便的使用它在服务器端调用远程的rest服务
- https://github.com/tj/co
- https://github.com/request/request

aq.Q()方法用来封装一个值或错误为Promise对象
``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.Q(1)
 .then( data => console.log(data) ) //1

aq.Q(null, new Error('an error'))

```

aq.apply() 方法， 运行一个函数并返回一个Promise对象，参数作为数组传递

``` javascript

let filename = 'data.txt'

aq.apply(fs, fs.readFile, [filename, 'utf-8'])
    .then( data => console.log(data) )  //output file data
    .catch( err => console.log(err) )
```

aq.call() 方法， 运行一个函数并返回一个Promise对象，参数跟随在方法后面传递

``` javascript

let filename = 'data.txt'

aq.call(fs, fs.readFile, filename, 'utf-8')
    .then( data => console.log(data) )  //output file data
    .catch( err => console.log(err) )
```


aq.rest() 方法，通过调用远程的rest服务返回一个Promise对象

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

aq.parallel() 方法可以同时执行多个Promise对象并将结果返回在一个数组里。

``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.parallel([aq.Q(1), aq.Q(2), aq.Q(3)])
 .then( data => console.log(data) )   //[1, 2, 3]

```

通过aq.rest和aq.parallel方法的组合使用我们可以方便的调用多个rest服务并将结果合并在一起。

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

aq.series() 方法可以依次执行多个Promise对象并返回最后一个Promise的结果
``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

aq.series([aq.Q(1), aq.Q(2), aq.Q(3)])
 .then( data => console.log(data) )   //3

```

aq.readFile() 方法可以异步读取一个文件并返回一个Promise对象作为结果
``` javascript
'use strict'

const aq = require('pitayax-services-core').aq

let filename = 'data.txt'

aq.readFile(filename, 'utf-8')
 .then( data => console.log(data) )   //output file data

```
