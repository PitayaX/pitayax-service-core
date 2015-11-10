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
    const conf = {"conf": {"port": port}}

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
定义的参数会保存context里，通过编写函数在查询数据的时候调用。

#### 默认行为


#### 执行体
执行体可以是执行一个单个的操作也可以定义一个数组执行一系列操作，这些操作的结果会作为一个数组返回。下面的parts定义，从三个
rest服务中获取数据。其运行结果应该是 [{"data1":"val1"}, {"data2":"val2"}, {"data3":"val3"}]

``` javascript

"action": "rest"
"parts": [
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data1=val1`}}},
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data2=val2`}}},
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data3=val3`}}}
        ]

```
每个parts节点可以包含headers和body， 如果他们可以是一个对象也可以是个函数，如果是函数可以包含一个context对象。context对象可以
