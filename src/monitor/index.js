'use strict';

const Socket = require('socket.io');
const http = require('http');
const Koa = require('koa');
const send = require('koa-send');
const statsFn = require('./stats');
const redisClient = require('../redis-client');
const redisKeys = require('../redis-keys');


/**
 *
 * @param {object} config
 * @return {object}
 */
function monitor(config = {}) {
    if (!config.hasOwnProperty('monitor') || !config.monitor.hasOwnProperty('enabled') || !config.monitor.enabled) {
        throw new Error('Monitor is not enabled!');
    }
    if (!config.monitor.hasOwnProperty('port') || !config.monitor.hasOwnProperty('host')) {
        throw new Error('HTTP port and host parameters are required!');
    }
    if (config.hasOwnProperty('namespace')) {
        redisKeys.setNamespace(config.namespace);
    }
    return {

        /**
         *
         * @param {function} cb
         */
        listen(cb) {
            /**
             * KOA setup
             */
            const app = new Koa();
            app.use(async (ctx) => {
                if (ctx.path === '/') await send(ctx, './assets/index.html', { root: __dirname });
                else await send(ctx, ctx.path, { root: __dirname });
            });

            /**
             * Socket.io setup
             */
            const io = new Socket();

            /**
             * HTTP setup
             */
            const server = http.createServer(app.callback());
            io.attach(server);
            server.listen(config.monitor.port, config.monitor.host, () => {
                /**
                 * Run stats
                 */
                const stats = statsFn(config);
                stats.run();

                /**
                 * Subscribe to 'stats' events and broadcast data to all Websocket clients
                 */
                const client = redisClient.getNewInstance(config);
                client.on('ready', () => {
                    client.subscribe('stats');
                });
                client.on('message', (channel, message) => {
                    const json = JSON.parse(message);
                    io.emit('stats', json);
                });
                cb();
            });
        },
    };
}

module.exports = monitor;
