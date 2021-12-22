import 'reflect-metadata';
import { createServer } from 'http';
import * as Koa from 'koa';
import { Server as SocketIO } from 'socket.io';
import * as KoaBodyParser from 'koa-bodyparser';
import { Middleware } from 'redis-smq-monitor';
import { IConfig, IMonitorServer } from '../../types';
import { RedisClient } from '../system/redis-client/redis-client';
import { Logger } from '../system/common/logger';
import { errorHandler } from './middlewares/error-handler';
import { Services } from './services';
import { resolve } from 'path';
import { getApplicationRouter } from './lib/routing';
import { messagesController } from './controllers/messages/messages.controller';
import { scheduledMessagesController } from './controllers/scheduled-messages/scheduled-messages.controller';
import { queuesController } from './controllers/queues/queues.controller';
import { IContext, TApplication } from './types/common';
import * as stoppable from 'stoppable';
import { PowerManager } from '../system/common/power-manager/power-manager';
import { promisifyAll } from 'bluebird';
import { WorkerRunner } from '../system/common/worker-runner/worker-runner';
import * as cors from '@koa/cors';
import { ArgumentError } from '../system/common/errors/argument.error';
import { ConfigurationError } from '../system/common/errors/configuration.error';
import { PanicError } from '../system/common/errors/panic.error';

const RedisClientAsync = promisifyAll(RedisClient);

type TAPIServer = {
  httpServer: ReturnType<typeof stoppable>;
  socketIO: SocketIO;
  app: TApplication;
};

async function bootstrap(config: IConfig): Promise<TAPIServer> {
  if (!config) {
    throw new ArgumentError('Configuration object is required.');
  }
  if (typeof config !== 'object') {
    throw new ArgumentError('Invalid argument type');
  }
  if (!config.monitor || !config.monitor.enabled) {
    throw new ConfigurationError('RedisSMQ monitor is not enabled. Exiting...');
  }
  const client = await RedisClientAsync.getNewInstanceAsync(config);
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
  app.use(
    cors({
      origin: '*',
    }),
  );
  const router = getApplicationRouter(app, [
    queuesController,
    messagesController,
    scheduledMessagesController,
  ]);
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

export function MonitorServer(config: IConfig = {}): IMonitorServer {
  const powerManager = new PowerManager();
  const { host = '0.0.0.0', port = 7210 } = config.monitor || {};
  const getApiServer = () => {
    if (!apiServer) {
      throw new PanicError(`Expected a non null value.`);
    }
    return apiServer;
  };
  const getSubscribeClient = () => {
    if (!subscribeClient) {
      throw new PanicError(`Expected a non null value.`);
    }
    return subscribeClient;
  };
  const workerRunner = promisifyAll(new WorkerRunner());
  let subscribeClient: RedisClient | null = null;
  let apiServer: TAPIServer | null = null;
  return {
    async listen() {
      powerManager.goingUp();
      apiServer = await bootstrap(config);
      const { app, socketIO, httpServer } = apiServer;
      await workerRunner.runAsync(resolve(__dirname, './workers'), config);
      subscribeClient = await RedisClientAsync.getNewInstanceAsync(config);
      subscribeClient.psubscribe('stream*');
      subscribeClient.on('pmessage', (pattern, channel, message) => {
        socketIO.emit(channel, JSON.parse(message));
      });
      httpServer.listen(port, host, () => {
        powerManager.commit();
        app.context.logger.info(
          `Monitor server is running on ${host}:${port}...`,
        );
      });
    },
    async quit() {
      powerManager.goingDown();
      const { app, httpServer } = getApiServer();
      await new Promise((resolve) => httpServer.stop(resolve));
      getSubscribeClient().end(true);
      app.context.redis.end(true);
      await workerRunner.shutdownAsync();
      powerManager.commit();
      apiServer = null;
      subscribeClient = null;
    },
  };
}
