'use strict';

const config = require('./config');
const { MonitorServer } = require('../..'); // require('redis-smq');

MonitorServer(config)
  .listen()
  .then(() => {
    console.log('It works!');
  });
