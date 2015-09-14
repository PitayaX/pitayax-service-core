'use strict';

let Logger = require('../../').Logger;
//let ConfigMap = require('../lib/conf').ConfigMap;

let logger = new Logger();
logger.Level = 3;


//let logger = new Logger();
logger.info('test');
logger.error('unkown crashed')
