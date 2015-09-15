'use strict';

const levelOfError = 1;
const levelOfWarning = 2;
const levelOfInfo = 3;
const levelOfVerbose = 4;

const defaultAppName = '';

class Logger {

    constructor(outputter, logLevel)
    {
        this.outputter = (outputter) ? outputter : Logger.createConsoleOutputter();
        this.logLevel = (logLevel) ? logLevel : levelOfError;

        this.appName= 'defaultAppName';
        this.debug = false;
        this.logLevels = new Map();
        this.logLevels.set(this.appName, this.logLevel);
    }

    get Debug(){return this.debug;}
    set Debug(value){this.debug = value;}

    get AppName() {return this.appName;}
    set AppName(name) {
        let level = this.Level;
        this.appName = name;
        this.Level = level;
    }

    get Level() {return this.getLogLevel(this.appName);}
    set Level(level) {this.setLogLevel(this.appName, level);}

    getLogLevel(appName) {
        if (this.logLevels.has(appName))
            return this.logLevels.get(appName);
        return this.Level;
    }
    setLogLevel(appName, level) {
        this.logLevels.set(appName, level);
    }

    error(message, appName) {
        this.log(levelOfError, message, appName)
    }

    warning(message, appName) {
        this.log(levelOfWarning, message, appName)
    }

    info(message, appName) {
        this.log(levelOfInfo, message, appName)
    }

    verbose(message, appName) {
        this.log(levelOfVerbose, message, appName)
    }

    debug(message, appName) {

        if (this.debug) this.info(message, appName);
    }

    log(level, message, appName) {

        if (!appName) appName = this.appName;

        //console.log(output);
        if (this.outputter && this.outputter.log){

            let currentLevel = this.getLogLevel(appName);
            if (level <= currentLevel) {

                let now = (new Date(Date.now())).toLocaleString();
                let line = `[${this.getLevelText(level)}] ${now}: ${message}`;

                //output log to outputter
                this.outputter.log(line);
            }
        };
    }

    getLevelText(level){
        switch(level) {
            case levelOfError:
                return 'Error';
            case levelOfWarning:
                return 'Warning';
            case levelOfVerbose:
                return 'Verbose';
            case levelOfInfo:
            default:
                return "Info"
        }
    }

    static createConsoleOutputter() {
        return console;
    }

    static createMemoryOutputter() {
        return null;
    }

    static createFileOutputter(logFile) {
        console.log(logFile);
        let fs = require('fs');

        let fileOuttputer = function(logFile){
            return {
                log: function(line){
                    fs.appendFileSync(logFile, line + '\r\n', 'utf-8');
                }
            }
        }

        return fileOuttputer(logFile);
    }
}

module.exports = Logger;
