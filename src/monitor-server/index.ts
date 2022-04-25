import 'reflect-metadata';
import { createServer } from 'http';
import * as Koa from 'koa';
import { Server as SocketIO } from 'socket.io';
import * as KoaBodyParser from 'koa-bodyparser';
import { Middleware } from 'redis-smq-monitor';
import { v4 as uuid } from 'uuid';
import { RedisClient } from '../system/common/redis-client/redis-client';
import { errorHandler } from './middlewares/error-handler';
import { initServices } from './services';
import { resolve } from 'path';
import { getApplicationRouter } from './lib/routing';
import { IContext, TApplication } from './types/common';
import * as stoppable from 'stoppable';
import { PowerManager } from '../system/common/power-manager/power-manager';
import { promisifyAll } from 'bluebird';
import { WorkerRunner } from '../system/common/worker/worker-runner/worker-runner';
import * as cors from '@koa/cors';
import { PanicError } from '../system/common/errors/panic.error';
import { apiController } from './controllers/api/api-controller';
import { getConfiguration } from '../system/common/configuration/configuration';
import { getNamespacedLogger } from '../system/common/logger';
import { redisKeys } from '../system/common/redis-keys/redis-keys';
import { WorkerPool } from '../system/common/worker/worker-runner/worker-pool';
import { events } from '../system/common/events';

type TBootstrapped = {
  httpServer: ReturnType<typeof stoppable>;
  socketIO: SocketIO;
  app: TApplication;
};

const RedisClientAsync = promisifyAll(RedisClient);
const RedisClientPrototypeAsync = promisifyAll(RedisClient.prototype);
type TRedisClientAsync = typeof RedisClientPrototypeAsync;

export class MonitorServer {
  protected config;
  protected powerManager;
  protected logger;
  protected instanceId: string;
  protected workerRunner: WorkerRunner | null = null;
  protected application: TBootstrapped | null = null;
  protected redisClient: TRedisClientAsync | null = null;
  protected subscribeClient: TRedisClientAsync | null = null;

  constructor() {
    this.instanceId = uuid();
    this.config = getConfiguration();
    this.powerManager = new PowerManager(false);
    this.logger = getNamespacedLogger(`MonitorServer/${this.instanceId}`);
  }

  protected getApplication(): TBootstrapped {
    if (!this.application) {
      throw new PanicError(`Expected a non null value.`);
    }
    return this.application;
  }

  protected getSubscribeClient(): TRedisClientAsync {
    if (!this.subscribeClient) {
      throw new PanicError(`Expected a non null value.`);
    }
    return this.subscribeClient;
  }

  protected getRedisClient(): TRedisClientAsync {
    if (!this.redisClient) {
      throw new PanicError(`Expected a non null value.`);
    }
    return this.redisClient;
  }

  protected getWorkerRunner(): WorkerRunner {
    if (!this.workerRunner) {
      throw new PanicError(`Expected a non null value.`);
    }
    return this.workerRunner;
  }

  protected async bootstrap(): Promise<TBootstrapped> {
    this.redisClient = promisifyAll(
      await RedisClientAsync.getNewInstanceAsync(),
    );
    const { socketOpts = {}, basePath } = this.config.monitor;
    const app = new Koa<Koa.DefaultState, IContext>();
    app.use(errorHandler);
    app.use(KoaBodyParser());
    app.use(Middleware(['/api/', '/socket.io/'], basePath));
    app.context.config = this.config;
    app.context.logger = this.logger;
    app.context.redis = this.redisClient;
    initServices(this.redisClient);
    app.use(
      cors({
        origin: '*',
      }),
    );
    const router = getApplicationRouter(app, [apiController]);
    app.use(router.routes());
    app.use(router.allowedMethods());
    const httpServer = stoppable(createServer(app.callback()));
    const socketIO = new SocketIO(httpServer, {
      ...socketOpts,
      cors: {
        origin: '*',
      },
    });
    this.application = {
      httpServer,
      socketIO,
      app,
    };
    return this.application;
  }

  protected async subscribe(socketIO: SocketIO): Promise<void> {
    this.subscribeClient = promisifyAll(
      await RedisClientAsync.getNewInstanceAsync(),
    );
    this.subscribeClient.psubscribe('stream*');
    this.subscribeClient.on('pmessage', (pattern, channel, message) => {
      socketIO.emit(channel, JSON.parse(message));
    });
  }

  protected async runWorkers(): Promise<void> {
    const { keyLockMonitorServerWorkers } = redisKeys.getMainKeys();
    this.workerRunner = new WorkerRunner(
      this.getRedisClient(),
      resolve(__dirname, './workers'),
      keyLockMonitorServerWorkers,
      {
        config: this.config,
        timeout: 1000,
      },
      new WorkerPool(),
    );
    this.workerRunner.on(events.ERROR, (err: Error) => {
      throw err;
    });
    await new Promise((resolve) => {
      this.workerRunner?.once(events.UP, resolve);
      this.workerRunner?.run();
    });
  }

  async listen(): Promise<boolean> {
    const { enabled, host = '0.0.0.0', port = 7210 } = this.config.monitor;
    if (!enabled) {
      throw new PanicError('Monitor server is not enabled. Enable it first.');
    }
    const r = this.powerManager.goingUp();
    if (r) {
      this.logger.info('Going up...');
      const { socketIO, httpServer } = await this.bootstrap();
      await this.subscribe(socketIO);
      await this.runWorkers();
      await new Promise<void>((resolve) => {
        httpServer.listen(port, host, resolve);
      });
      this.powerManager.commit();
      this.logger.info(`Instance ID is ${this.instanceId}.`);
      this.logger.info(`Up and running on ${host}:${port}...`);
      return true;
    }
    return false;
  }

  async quit(): Promise<boolean> {
    const r = this.powerManager.goingDown();
    if (r) {
      this.logger.info('Going down...');
      const { httpServer } = this.getApplication();
      await new Promise((resolve) => httpServer.stop(resolve));
      await this.getSubscribeClient().haltAsync();
      await this.getRedisClient().haltAsync();
      await promisifyAll(this.getWorkerRunner()).quitAsync();
      this.workerRunner = null;
      this.application = null;
      this.powerManager.commit();
      this.logger.info('Down.');
      return true;
    }
    return false;
  }
}
