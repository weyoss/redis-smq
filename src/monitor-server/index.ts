import { createServer } from 'http';
import { resolve } from 'path';
import * as Koa from 'koa';
import { fork } from 'child_process';
import { Server as SocketIO } from 'socket.io';
import * as KoaBodyParser from 'koa-bodyparser';
import { Middleware } from 'redis-smq-monitor';
import { IConfig, TCallback } from '../../types';
import { api } from './routes';
import { RedisClient } from '../redis-client';

function runStatsAggregator(config: IConfig) {
  const statsAggregatorThread = fork(
    resolve(`${__dirname}/stats-aggregator.js`),
  );
  statsAggregatorThread.on('error', (err) => {
    throw err;
  });
  statsAggregatorThread.on('exit', (code, signal) => {
    throw new Error(
      `statsAggregatorThread exited with code ${code} and signal ${signal}`,
    );
  });
  statsAggregatorThread.send(JSON.stringify(config));
}

export function MonitorServer(config: IConfig = {}) {
  if (!config) {
    throw new Error('Configuration object is required.');
  }
  if (typeof config !== 'object') {
    throw new Error('Invalid argument type');
  }
  if (!config.monitor || !config.monitor.enabled) {
    throw new Error('RedisSMQ monitor is not enabled. Exiting...');
  }
  const {
    host = '0.0.0.0',
    port = 7210,
    socketOpts = {},
  } = config.monitor || {};
  const app = new Koa();
  app.use(Middleware(['/api/', '/socket.io/']));
  app.use(KoaBodyParser());
  app.use(api.routes());
  app.use(api.allowedMethods());
  const httpServer = createServer(app.callback());
  const socketIO = new SocketIO(httpServer, {
    ...socketOpts,
    cors: {
      origin: '*',
    },
  });
  return {
    listen(cb?: TCallback<void>) {
      runStatsAggregator(config);
      RedisClient.getInstance(config, (client) => {
        console.log('Successfully connected to Redis server.');
        client.subscribe('stats');
        client.on('message', (channel, message) => {
          const json = JSON.parse(message) as Record<string, any>;
          socketIO.emit('stats', json);
        });
        httpServer.listen(port, host, () => cb && cb());
      });
    },
  };
}
