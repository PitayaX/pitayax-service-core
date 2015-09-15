'use strict';

let assert = require('assert');
let Logger = require('../../').Logger;
//let ConfigMap = require('../lib/conf').ConfigMap;

let path = require('path');

try{
    console.log('Start to test class Logger.');

    let outputter = Logger.createMemoryOutputter();

    //logger = new Logger(Logger.createFileOutputter(path.join(__dirname, 'app.log')));
    let logger = new Logger(outputter);

    //init properies for logger
    logger.LineFormat = "`${level} - ${message}`"
    logger.Level = 4;
    logger.getLevelText = level => level;

    //start test methods error, warning, info and verbose
    logger.error('error message');
    assert.equal(outputter.toString(), '1 - error message', 'error method');
    outputter.clear();

    logger.warning('warning message');
    assert.equal(outputter.toString(), '2 - warning message', 'warning method');
    outputter.clear();

    logger.info('info message');
    assert.equal(outputter.toString(), '3 - info message', 'info method');
    outputter.clear();

    logger.verbose('verbose message');
    assert.equal(outputter.toString(), '4 - verbose message', 'verbose method');
    outputter.clear();

    console.log('Tested the methods of error, warning, info and verbose');

    logger.Level = 3;

    logger.DebugMode = true;
    logger.debug('debug message');
    assert.equal(outputter.toString(), '3 - debug message', 'debug method');
    outputter.clear();

    logger.DebugMode = false;
    logger.debug('debug message');
    assert.notEqual(outputter.toString(), '3 - debug message', 'debug method');
    outputter.clear();

    console.log('Tested the method of debug');

    logger.Level = 3;
    logger.getMessageText = message => `[${message}]`;
    logger.info('message');
    assert.equal(outputter.toString(), '3 - [message]', 'overwrite getMessageText');
    outputter.clear();
    console.log('Tested change message format.');

    let testEntries = [
        [logger.info, 'info message'],
        [logger.error, 'error message'],
        [logger.error, 'error message for de', 'DataEngine'],
        [logger.info, 'info message for de', 'DataEngine'],
        [logger.warning, 'warning message for forms', 'Forms'],
        [logger.info, 'info message for forms', 'Forms']
    ]

    let testLogger = function(){
        testEntries.forEach(function(items) {
            if (items.length > 2) {
                items[0].call(logger, items[1], items[2]);
            }
            else if (items.length > 1) {
                items[0].call(logger, items[1]);
            }
        })
    }

    //reset level and format
    logger.Level = 3;

    logger.setLogLevel('DataEngine', 3)
    logger.setLogLevel('Forms', 2)
    testLogger();

    let entries = outputter.toArray();
    assert.equal(entries.length, 5, 'test engine 1');
    outputter.clear();

    //change application level
    logger.setLogLevel('DataEngine', 1)
    logger.setLogLevel('Forms', 1)
    testLogger();

    entries = outputter.toArray();
    assert.equal(entries.length, 3, 'test engine 1');
    outputter.clear();
    console.log('Tested level flag.');

    console.log('Class Logger tested OK!');
}
catch(err) {
    if (err instanceof assert.AssertionError){
        console.log(`Tested ${err.message} failed`);
    }
    else{
        console.log(`Unexcpeted error occur, details: ${err.message}.`);
    }
}


//console.log(outputter.toString());
