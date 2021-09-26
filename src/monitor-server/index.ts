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
import { startThreads, stopThreads } from './utils/thread-runner';
import { resolve } from 'path';
import { getApplicationRouter } from './lib/routing';
import { schedulerController } from './controllers/scheduler';
import { IContext } from './types/common';
import * as stoppable from 'stoppable';
import { PowerManager } from '../power-manager';

function bootstrap(config: IConfig) {
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
  const { socketOpts = {} } = config.monitor || {};
  const app = new Koa<Koa.DefaultState, IContext>();
  app.use(errorHandler);
  app.use(Middleware(['/api/', '/socket.io/']));
  app.use(KoaBodyParser());
  app.context.config = config;
  app.context.logger = logger;
  app.context.redis = new RedisClient(config);
  app.context.services = Services(app);
  const router = getApplicationRouter(app, [schedulerController]);
  app.use(router.routes());
  app.use(router.allowedMethods());
  const httpServer = stoppable(createServer(app.callback()));
  const socketIO = new SocketIO(httpServer, {
    ...socketOpts,
    cors: {
      origin: '*',
    },
  });
  return {
    httpServer,
    socketIO,
    app,
  };
}

export function MonitorServer(config: IConfig = {}) {
  const powerManager = new PowerManager();
  const { host = '0.0.0.0', port = 7210 } = config.monitor || {};
  let subscribeClient: RedisClient | null = null;
  let application: ReturnType<typeof bootstrap> | null = null;
  function getApplication() {
    if (!application) {
      throw new Error(`Expected a non null value.`);
    }
    return application;
  }
  function getSubscribeClient() {
    if (!subscribeClient) {
      throw new Error(`Expected a non null value.`);
    }
    return subscribeClient;
  }
  return {
    listen(cb?: TCallback<void>) {
      powerManager.goingUp();
      application = bootstrap(config);
      startThreads(config, resolve(__dirname, './threads'));
      subscribeClient = new RedisClient(config);
      subscribeClient.on('ready', () => {
        const client = getSubscribeClient();
        client.subscribe('stats');
        client.on('message', (channel, message) => {
          const json = JSON.parse(message) as Record<string, any>;
          getApplication().socketIO.emit('stats', json);
        });
      });
      getApplication().httpServer.listen(port, host, () => {
        powerManager.commit();
        getApplication().app.context.logger.info(
          `Monitor server is running on ${host}:${port}...`,
        );
        cb && cb();
      });
    },
    getHttpServer() {
      if (!powerManager.isRunning()) {
        throw new Error('API server is not running.');
      }
      const { httpServer } = getApplication();
      return httpServer;
    },
    quit(cb?: TCallback<void>) {
      powerManager.goingDown();
      const { app, httpServer } = getApplication();
      httpServer.stop(() => {
        subscribeClient?.end(true);
        app.context.redis.end(true);
        stopThreads(() => {
          powerManager.commit();
          application = null;
          subscribeClient = null;
          cb && cb();
        });
      });
    },
  };
}
