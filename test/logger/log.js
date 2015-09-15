'use strict';

let Logger = require('../../').Logger;
//let ConfigMap = require('../lib/conf').ConfigMap;

let logger = new Logger();
logger.Level = 3;


//let logger = new Logger();
logger.info('test');
logger.error('unkown crashed')

logger.setLogLevel('DataEngine', 3)
logger.setLogLevel('Forms', 2)

logger.error('error de', 'DataEngine');
logger.info('info de', 'DataEngine');
logger.warning('warning forms', 'Forms');
logger.info('info forms', 'Forms');


let path = require('path');
logger = new Logger(Logger.createFileOutputter(path.join(__dirname, 'app.log')));
logger.Level = 3;
//logger.setLogLevel('DataEngine', 3)
//logger.setLogLevel('Forms', 2)

logger.info('test');
logger.error('unkown crashed')
logger.error('error de', 'DataEngine');
logger.info('info de', 'DataEngine');
logger.warning('warning forms', 'Forms');
logger.info('info forms', 'Forms');
