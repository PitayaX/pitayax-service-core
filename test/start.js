'use strict';

require('../');
//console.log('hm: ' + harmonyMode);
require('child_process').fork('test/conf/conf.js');
