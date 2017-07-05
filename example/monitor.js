'use strict';

const config = require('./config');
const monitorServer = require('./../index').monitor(config);
monitorServer.listen(() => {
    console.log('Monitor server is running...');
});