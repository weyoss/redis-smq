import 'reflect-metadata';
import { createServer } from 'http';
import * as Koa from 'koa';
import { Server as SocketIO } from 'socket.io';
import * as KoaBodyParser from 'koa-bodyparser';
import { Middleware } from 'redis-smq-monitor';
import { IConfig, TCallback } from '../../types';
import { RedisClient } from '../redis-client';
import { Logger } from '../logger';
import { errorHandler } from './middlewares/error-handler';
import { Services } from './services';
import { startThreads } from './utils/thread-runner';
import { resolve } from 'path';
import { getApplicationRouter } from './lib/routing';
import { schedulerController } from './controllers/scheduler';
import { IContext } from './types/common';

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
  const logger = Logger('monitor-server', config.log);
  const {
    host = '0.0.0.0',
    port = 7210,
    socketOpts = {},
  } = config.monitor || {};
  const app = new Koa<Koa.DefaultState, IContext>();
  app.use(errorHandler);
  app.use(Middleware(['/api/', '/socket.io/']));
  app.use(KoaBodyParser());
  app.context.config = config;
  app.context.redis = new RedisClient(config);
  app.context.services = Services(app);

  const router = getApplicationRouter(app, [schedulerController]);
  app.use(router.routes());
  app.use(router.allowedMethods());

  const httpServer = createServer(app.callback());
  const socketIO = new SocketIO(httpServer, {
    ...socketOpts,
    cors: {
      origin: '*',
    },
  });
  return {
    listen(cb?: TCallback<void>) {
      startThreads(config, resolve(__dirname, './threads'));
      const redisClient = new RedisClient(config);
      redisClient.subscribe('stats');
      redisClient.on('message', (channel, message) => {
        const json = JSON.parse(message) as Record<string, any>;
        socketIO.emit('stats', json);
      });
      httpServer.listen(port, host, () => {
        logger.info(`Monitor server is running on ${host}:${port}...`);
        cb && cb();
      });
    },
  };
}
