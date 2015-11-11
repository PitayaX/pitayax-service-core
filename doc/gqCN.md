## gq
gq (graph query) 对象提供了一个脚本引擎去合并和处理不同来源的数据。数据可以来源于rest服务或者数据库 (目前仅支持mongo)


#### 编写一个最简单的脚本
test.js代码如下
``` javascript
{
    "version":"2.0.0",
    "parts": {"body":"Hello World!"}
}
```

使用脚本引擎进行调用，Parser负责解析一个文件称脚本对象，Engine对象负责执行脚本
``` javascript
'use strict'

const gq = require('../../').gq

const Parser = gq.Parser
const Engine = gq.Engine

//定义执行脚本的函数
const testScript = function(script, args)
{

    const scriptFile = path.join(__dirname, script)
    const scriptArgs = (args) ? args : []
    const conf = {"port": port}

    return (
        Parser.parse(scriptFile)
            .then(script => {
              const engine = new Engine(script)

              engine.setContextItem('conf', conf)
              return engine.execute(scriptArgs)
            })
        )
}

//执行脚本test.js
testScript('/test.js')
    .then( data => console.log(data) ) //"Hello World!"
```

#### 给脚本添加参数
一个参数可以使用如下的对象进行描述

``` javascript
"arg1":{"default": 1, "type":"number"}
```

通常我们以忽略default的值，简写成这样

``` javascript
"arg1": "number"
```

接下来给脚本定义二参数arg1和arg2，一个参数是字符串，第二个是数值类型的。下面是test2.js的代码
``` javascript
{
    "version":"2.0.0",
    "arguments": {
        "arg1": "string",
        "arg2": "number"
    },
    "parts": {
            "body": function(ctx) {
                let args = ctx.args;
                return {
                    "result": "t",
                    "data": args.arg1
                }
            }
    }
}
```
定义的参数会保存context里，通过编写函数在查询或处理数据的时候调用，在后面的章节会详细说明context的用法。

#### 执行体
执行体 (parts) 用来定义一个或者一组操作，每个执行体主要包含action, headers, body和after函数4各部分
``` javascript
"parts"{
  "action":  "rest",
  "headers": {"url": "http://127.0.0.1:8000", "method":"POST"},
  "body": {"key1":"val1"},
  "after": (ctx, data) => data
}
```
- action是行为的名称，目前支持directly, rest和mongo。action亦可以定义在脚本范围，这样如果part部分省略了action的定义，当前的part将使用脚本级的action
  - directly 直接返回body里的内容，默认值
  - rest 执行远程rest服务，返回结果
  - mongo 执行mongo数据库的CRUD操作，返回结果
- headers节点，返回一个对象包含执行行为的各项参数，比如rest服务的URL，HTTP方法等。
- body节点，返回一个对象包含提交的内容主体，相当于rest服务的
- after节点，可以定义一个函数用于处理返回的结果，如不定义则返回原始结果。

headers和body既可以是一个静态对象的描述，也可以是一个函数。脚本引擎会根据其类型自动执行。

parts也可以定义成一个数组，此时脚本执行的结果也将返回一个数组，返回的数据可以在脚本级的after函数内再处理

``` javascript

"action": "rest",
"parts": [
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data1=val1`}}},
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data2=val2`}}},
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data3=val3`}}}
        ],
"after": (ctx, data) => data[0]
```
上面的例子调用了3个rest服务，但是最终只返回第一个rest服务的结果{"data1":"val1"}。如果我们不在这里定义after方法其运行结果应该是 [{"data1":"val1"}, {"data2":"val2"}, {"data3":"val3"}]

#### after函数
after函数可以处理返回的数据，比如取得的数据来自于不同的数据源，可以同过after函数进行合并，或者对返回的数据进行再处理以期得到想要的数据。下面的代码演示了将一个数组中某个对象数组合并成一个简单的数组

``` javascript
"after": (ctx, data) => {
  let keys = []

  data.map( row => row.tags)
    .forEach( arr => {
      arr.forEach( key => {
        if (keys.indexOf(key) === -1) keys.push(key)
      })
    })

  return keys
}
```

#### context
context是整个脚本的上下文环境，默认具有args和global两个属性，我们可以通过下面的代码去添加自定义的context属性

``` javascript
const engine = new Engine(script)

engine.setContextItem('conf', {"k1":"va1", "k2":3})
engine.setContextItem('req', req)
```
context作为参数可以在任一headers, body和after函数中使用，其中的绝大部分变量是全局的，既在整个script范围内是有效的。

``` javascript
"headers": ctx => {
    return {
      "url": `http://127.0.0.1:${ctx.conf.port}/?data1=val1`
    }
  }
```

#### parts嵌套
