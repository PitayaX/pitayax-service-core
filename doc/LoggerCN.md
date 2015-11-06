## logger
logger对象可以用来输出日志到文件，终端，内存或者数据库等

``` javascript
'use strict';

const logger = require('pitayax-services-core').logger;

//设置输出日志的文件名
const logFile = 'output.log'

//创建一个文件输出体
const outputter = Logger.createFileOutputter(logFile)

//创建一个新的logger实例，基于一个输出体最为构造函数的参数
const logger = new Logger(outputter)

//输出一行日志
logger.info('message line', 'app name')
```

### 我们可以用Logger.createFileOutputter(logFile)去创建一个默认的文件输出体。用户也可以自定义文件输出体，文件输出体只需要实现一个方法，即log(line)方法，logger每次输出日志时会调用这个方法，下面的实例演示如何自定义一个输出体。

``` javascript

class DatabaseOutputer
{
  log(line)
  {
    //write line to database
  }
}

//创建一个文件输出体
const outputter = new DatabaseOutputer()

//创建一个新的logger实例
const logger = new Logger(outputter)

logger.info('message line', 'app name')

```

### logger可以输出4种级别的日志，分别通过下面5个方法调用。此方法的第一个参数为输出日志的消息内容，第二个参数是输出日志的应用，可忽略

``` javascript
//输出错误信息
logger.error('message line', 'app name')

//输出警告信息
logger.warning('message line', 'app name')

//输出一般信息
logger.info('message line', 'app name')

//输出详细信息
logger.verbose('message line', 'app name')

//输出调试信息
logger.debug('message line', 'app name')
```

可以通过设置logger.level和logger.setLogLevel()来控制输出日志的详细度。
level = 1 只输出错误信息
level = 2 只输出错误和警告信息
level = 3 只输出错误，警告和一般信息
level = 4 输出所有信息
logger.debug()方法仅在logger.DebugMode = true 时输出日志，并且忽略verbose()方法输出的日志

logger.setLogLevel(appName, level)可以指定某个应用的输出级别，也可以通过logger.getLogLevel(appName)来获取对应的level值

``` javascript
logger.setLogLevel('App1', 3)

//level等于3
let level = logger.getLogLevel('App1')

```

### 可以通过修改logger.lineFormat来设置日志输出格式，lineFormat可以支持4个变量, $level, $now, $message和$app。分别对应输出日志的级别，时间，信息和应用名称。

``` javascript
logger.lineFormat = '[$level] $now: $message ($app)'
```
还可以通过下列函数定义输出变量的格式
- getTimespanFormat(timeSpan) 方法可以定义输出的时间的格式，对应$now变量
- getLevelText(level) 方法可以定义输出的日志级别的格式，对应$level变量
- getMessageText(message) 方法可以定义输出的信息的格式，对应$message变量
