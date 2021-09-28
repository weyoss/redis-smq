import 'reflect-metadata';
import { createServer } from 'http';
import * as Koa from 'koa';
import { Server as SocketIO } from 'socket.io';
import * as KoaBodyParser from 'koa-bodyparser';
import { Middleware } from 'redis-smq-monitor';
import { IConfig, ICallback } from '../../types';
import { RedisClient } from '../redis-client';
import { Logger } from '../logger';
import { errorHandler } from './middlewares/error-handler';
import { Services } from './services';
import { startThreads, stopThreads } from './utils/thread-runner';
import { resolve } from 'path';
import { getApplicationRouter } from './lib/routing';
import { schedulerController } from './controllers/scheduler';
import { IContext, TApplication } from './types/common';
import * as stoppable from 'stoppable';
import { PowerManager } from '../power-manager';

type TApiServer = {
  httpServer: ReturnType<typeof stoppable>;
  socketIO: SocketIO;
  app: TApplication;
};

function bootstrap(config: IConfig, cb: (result: TApiServer) => void) {
  if (!config) {
    throw new Error('Configuration object is required.');
  }
  if (typeof config !== 'object') {
    throw new Error('Invalid argument type');
  }
  if (!config.monitor || !config.monitor.enabled) {
    throw new Error('RedisSMQ monitor is not enabled. Exiting...');
  }
  RedisClient.getInstance(config, (client) => {
    const logger = Logger('monitor-server', config.log);
    const { socketOpts = {} } = config.monitor || {};
    const app = new Koa<Koa.DefaultState, IContext>();
    app.use(errorHandler);
    app.use(Middleware(['/api/', '/socket.io/']));
    app.use(KoaBodyParser());
    app.context.config = config;
    app.context.logger = logger;
    app.context.redis = client;
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
    cb({
      httpServer,
      socketIO,
      app,
    });
  });
}

export function MonitorServer(config: IConfig = {}) {
  const powerManager = new PowerManager();
  const { host = '0.0.0.0', port = 7210 } = config.monitor || {};
  let subscribeClient: RedisClient | null = null;
  let apiServer: TApiServer | null = null;
  function getApiServer() {
    if (!apiServer) {
      throw new Error(`Expected a non null value.`);
    }
    return apiServer;
  }
  function getSubscribeClient() {
    if (!subscribeClient) {
      throw new Error(`Expected a non null value.`);
    }
    return subscribeClient;
  }
  return {
    // @todo use async/await in the next major release
    // Keeping callback signature for compatibility with v3
    listen(cb?: ICallback<void>) {
      powerManager.goingUp();
      bootstrap(config, (result) => {
        apiServer = result;
        const { app, socketIO, httpServer } = result;
        startThreads(config, resolve(__dirname, './threads'));
        RedisClient.getInstance(config, (client) => {
          subscribeClient = client;
          subscribeClient.subscribe('stats');
          subscribeClient.on('message', (channel, message) => {
            const json = JSON.parse(message) as Record<string, any>;
            socketIO.emit('stats', json);
          });
          httpServer.listen(port, host, () => {
            powerManager.commit();
            app.context.logger.info(
              `Monitor server is running on ${host}:${port}...`,
            );
            cb && cb();
          });
        });
      });
    },
    getHttpServer() {
      if (!powerManager.isRunning()) {
        throw new Error('API server is not running.');
      }
      const { httpServer } = getApiServer();
      return httpServer;
    },
    quit(cb?: ICallback<void>) {
      powerManager.goingDown();
      const { app, httpServer } = getApiServer();
      httpServer.stop(() => {
        getSubscribeClient().end(true);
        app.context.redis.end(true);
        stopThreads(() => {
          powerManager.commit();
          apiServer = null;
          subscribeClient = null;
          cb && cb();
        });
      });
    },
  };
}
