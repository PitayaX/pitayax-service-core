'use strict'

const levelOfError = 1
const levelOfWarning = 2
const levelOfInfo = 3
const levelOfVerbose = 4

const defaultAppName = ''

class Logger
{
  constructor(outputter, logLevel)
  {
    this.outputter = (outputter) ? outputter : Logger.createConsoleOutputter()
    this.logLevel = (logLevel) ? logLevel : levelOfInfo

    this.appName= 'defaultAppName'
    this.debugMode = false
    this.logLevels = new Map()
    this.logLevels.set(this.appName, this.logLevel)
    this.lineFormat = "[$level] $now: $message"
  }

  get DebugMode() { return this.debugMode }
  set DebugMode(value) { this.debugMode = value }

  get AppName() { return this.appName }
  set AppName(name) {
      let level = this.Level
      this.appName = name
      this.Level = level
  }

  get LineFormat() { return this.lineFormat }
  set LineFormat(value) { this.lineFormat = value }


  get Level() { return this.getLogLevel(this.appName) }
  set Level(level) { this.setLogLevel(this.appName, level) }

  getLogLevel(appName)
  {
    return (this.logLevels.has(appName))
      ? this.logLevels.get(appName)
      : this.Level
  }
  setLogLevel(appName, level)
  {
    this.logLevels.set(appName, level)
  }

  error(message, appName)
  {
    this.log(levelOfError, message, appName)
  }

  warning(message, appName)
  {
    this.log(levelOfWarning, message, appName)
  }

  info(message, appName)
  {
    this.log(levelOfInfo, message, appName)
  }

  verbose(message, appName)
  {
    this.log(levelOfVerbose, message, appName)
  }

  debug(message, appName)
  {
    if (this.DebugMode) this.info(message, appName)
  }

  log(level, message, appName)
  {
    if (!appName) appName = this.appName

    //check outputter before write log entry
    if (this.outputter && this.outputter.log)
    {

      const currentLevel = this.getLogLevel(appName)
      if (level <= currentLevel)
      {

        let now = new Date(Date.now())

        now = this.getTimespanFormat(now)
        level = this.getLevelText(level)
        message = this.getMessageText(message)

        let line = this.lineFormat
                    .replace('$level', level)
                    .replace('$now', now)
                    .replace('$message', message)
                    .replace('$app', appName)

        //output log to outputter
        this.outputter.log(line)
      }
    }
  }

  getTimespanFormat(timeSpan)
  {
    return timeSpan.toLocaleString()
  }

  getLevelText(level)
  {
    switch(level)
    {
      case levelOfError:
        return 'Error'
      case levelOfWarning:
        return 'Warning'
      case levelOfVerbose:
        return 'Verbose'
      case levelOfInfo:
      default:
        return "Info"
    }
  }

  getMessageText(message)
  {
    return message
  }

  static createConsoleOutputter() {
    return console
  }

  static createMemoryOutputter() {
    let buffer = []

    const bufferOutputter = function() {

      return {
        log: (line) => buffer.push(line),
        toArray: () => buffer,
        toString: () =>  buffer.join('\r\n'),
        clear: () => { buffer = [] }
      }
    }

    return bufferOutputter()
  }

  static createFileOutputter(logFile) {
    const fs = require('fs')

    const fileOutputter = function(logFile){
      return {
        log: (line) => { fs.appendFileSync(logFile, line + '\r\n', 'utf-8') }
      }
    }

    return fileOutputter(logFile)
  }
}

module.exports = Logger
