'use strict';

const config = require('./config');
const { MonitorServer } = require('../..'); // replace with require('redis-smq');

MonitorServer(config).listen(() => {
    console.log('It works!');
});
