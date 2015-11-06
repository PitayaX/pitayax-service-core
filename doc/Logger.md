## logger
logger object can use to output log to file, console, memory or database

``` javascript
'use strict';

const logger = require('pitayax-services-core').logger;

//declare log file name
const logFile = 'output.log'

//create new instance of outputter
const outputter = Logger.createFileOutputter(logFile)

//create new instance of logger
const logger = new Logger(outputter)

//output one line to logger
logger.info('message line', 'app name')
```

### We can use Logger.createFileOutputter(logFile) to create a default output. Use can custom outputter, the outputer class only implement one method, it is log(line), logger will call it every time when output log, please see following code

``` javascript

class DatabaseOutputer
{
  log(line)
  {
    //write line to database
  }
}

//create new instance of outputter
const outputter = new DatabaseOutputer()

//create new instance of logger
const logger = new Logger(outputter)

//output one line to logger
logger.info('message line', 'app name')

```

### logger can output 4 levels entry, you can use below 5 methods to call it. The first parameter is message for log, the second parameter is application name

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

You can set the value of logger.level and logger.setLogLevel() to control which level log entries were outputted.
level = 1 only output error message
level = 2 only output error and warning message
level = 3 only output error, warning and info message
level = 4 output all message
the logger.debug() method only output log when logger.DebugMode = true, also ignore the message called by verbose()

The method logger.setLogLevel(appName, level) can set level for one named application, also can through logger.getLogLevel(appName) to get the level by appliation name

``` javascript
logger.setLogLevel('App1', 3)

//level等于3
let level = logger.getLogLevel('App1')

```

### You can modify the logger.lineFormat to change the style of output line, lineFormat to support 4 variants,  $level, $now, $message and $app. You can use it replace log level, timespan, message and application name.

``` javascript
logger.lineFormat = '[$level] $now: $message ($app)'
```
We can use following methods to change style for log line
- getTimespanFormat(timeSpan) custom the time style, related $now
- getLevelText(level) custom the level value，related $level
- getMessageText(message) custom the message line, relate $message
