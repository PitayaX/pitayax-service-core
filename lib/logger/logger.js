'use strict';

const levelOfError = 1;
const levelOfWarning = 2;
const levelOfInfo = 3;
const levelOfVerbose = 4;

class Logger {

    constructor(outputter, logLevel)
    {
        this.outputter = (outputter) ? outputter : console;
        this.logLevel = (logLevel) ? logLevel : levelOfError;
    }

    get Level() {return this.logLevel;}
    set Level(level) {this.logLevel = level;}

    error(message) {
        this.log(levelOfError, message)
    }

    warning(message) {
        this.log(levelOfWarning, message)
    }

    info(message) {
        this.log(levelOfInfo, message)
    }

    verbose(message) {
        this.log(levelOfVerbose, message)
    }

    log(level, message) {

        let now = (new Date(Date.now())).toLocaleString();
        let output = `[${this.getLevelText(level)}] ${now}: ${message}`;

        //console.log(output);
        if (level <= this.logLevel){
            //output log to outputter
            this.outputter.log(output);
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
}

module.exports = Logger;
