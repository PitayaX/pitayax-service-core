## gq
gq (graph query) 对象提供了一个脚本引擎去合并和处理不同来源的数据。数据可以来源于rest服务或者数据库 (目前仅支持mongo)


下面暂时了一个简单的脚本编写，和调用的方法

使用脚本引擎进行调用，Parser负责解析一个文件称脚本对象，Engine对象负责执行脚本
``` javascript
'use strict'

const gq = require('../../').gq

const Parser = gq.Parser
const Engine = gq.Engine

let scriptFile = '/test.js'

Parser.parse(scriptFile)
    .then( script => {
      const engine = new Engine(script)

      engine.setContextItem('conf', {"port": port})

      return engine.execute(["test", 2])
    })
    .then( data => console.log(data) ) //"test"
```

test.js代码如下
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
整个脚本主要包含2部分节点，参数(arguments)和执行体(parts)。

参数部分可以有一个或多个参数，每个参数注明名称和类型。如果该脚本不需要参数，可以不把Arguments写入脚本。一个完整的参数写法如下，通常我们以忽略default的值。
``` javascript
"arg1":{"default": 1, "type":"number"}
```
执行体可以是执行一个单个的操作也可以定义一个数组执行一系列操作，这些操作的结果会作为一个数组返回。下面的parts定义，从三个
rest服务中获取数据。其运行结果应该是 [{"data1":"val1"}, {"data2":"val2"}, {"data3":"val3"}]

``` javascript

"parts": [
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data1=val1`}}},
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data2=val2`}}},
            {"headers": ctx => {return {"url": `http://127.0.0.1:${ctx.conf.port}/?data3=val3`}}}
        ]

```
parts节点可以包含一个或多个操作，每个操作
