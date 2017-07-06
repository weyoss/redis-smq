'use strict';

const config = require('./config');
const monitorServer = require('redis-smq').monitor(config);

monitorServer.listen(() => {
    console.log('Monitor server is running...');
});
