'use strict'

let assert = require('assert')
let Logger = require('../../').Logger
//let ConfigMap = require('../lib/conf').ConfigMap

let path = require('path')

let outputter = Logger.createMemoryOutputter()
let logger = new Logger(outputter)

//init properies for logger
logger.LineFormat = "$level - $message"
logger.Level = 4
logger.getLevelText = level => level

describe('logger', function() {
    it('the methods of error, warning, info and verbose', function() {
        //start test methods error, warning, info and verbose
        logger.error('error message')
        let logEntry = outputter.toString()
        assert.equal(logEntry, '1 - error message', 'error method')
        outputter.clear()

        logger.warning('warning message')
        assert.equal(outputter.toString(), '2 - warning message', 'warning method')
        outputter.clear()

        logger.info('info message')
        assert.equal(outputter.toString(), '3 - info message', 'info method')
        outputter.clear()

        logger.verbose('verbose message')
        assert.equal(outputter.toString(), '4 - verbose message', 'verbose method')
        outputter.clear()
    })

    it('output debug info to logger', function() {
        logger.Level = 3

        logger.DebugMode = true
        logger.debug('debug message')
        assert.equal(outputter.toString(), '3 - debug message', 'debug method')
        outputter.clear()

        logger.DebugMode = false
        logger.debug('debug message')
        assert.notEqual(outputter.toString(), '3 - debug message', 'debug method')
        outputter.clear()
    })

    it('change message format', function() {

        logger.Level = 3
        logger.getMessageText = message => `[${message}]`
        logger.info('message')
        assert.equal(outputter.toString(), '3 - [message]', 'overwrite getMessageText')
        outputter.clear()
    })

    it('level flag', function() {
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
                    items[0].call(logger, items[1], items[2])
                }
                else if (items.length > 1) {
                    items[0].call(logger, items[1])
                }
            })
        }

        //reset level and format
        logger.Level = 3

        logger.setLogLevel('DataEngine', 3)
        logger.setLogLevel('Forms', 2)
        testLogger()

        let entries = outputter.toArray()
        assert.equal(entries.length, 5, 'test engine 1')
        outputter.clear()

        //change application level
        logger.setLogLevel('DataEngine', 1)
        logger.setLogLevel('Forms', 1)
        testLogger()

        entries = outputter.toArray()
        assert.equal(entries.length, 3, 'test engine 1')
        outputter.clear()
    })
})
