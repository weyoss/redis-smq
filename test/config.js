'use strict';

module.exports = {
    namespace: 'testing',
    redis: {
        driver: 'redis',
        //options: {
        //    host: '192.168.23.129',
        //    port: 6379,
        //},
    },
    monitor: {
        enabled: true,
        host: '127.0.0.1',
        port: 3000,
    },
};