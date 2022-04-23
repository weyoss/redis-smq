import { join } from 'path';
import { readdir } from 'fs';
import {
  ICallback,
  ICompatibleLogger,
  TWorkerClassConstructor,
  TWorkerParameters,
} from '../../../../../types';
import { PowerManager } from '../../power-manager/power-manager';
import { EventEmitter } from 'events';
import { Ticker } from '../../ticker/ticker';
import { LockManager } from '../../lock-manager/lock-manager';
import { RedisClient } from '../../redis-client/redis-client';
import { getNamespacedLogger } from '../../logger';
import { events } from '../../events';
import { WorkerPool } from './worker-pool';
import { EmptyCallbackReplyError } from '../../errors/empty-callback-reply.error';
import { Worker } from '../worker';
import { PanicError } from '../../errors/panic.error';
import { each, waterfall } from '../../../lib/async';

export class WorkerRunner<
  WorkerParameters extends TWorkerParameters = TWorkerParameters,
> extends EventEmitter {
  private readonly workersDir: string;
  private readonly workerParameters: WorkerParameters;
  private readonly powerManager: PowerManager;
  private readonly ticker: Ticker;
  private readonly lockManager: LockManager;
  private readonly redisClient: RedisClient;
  private readonly logger: ICompatibleLogger;
  private readonly workerPool: WorkerPool;
  private initialized = false;

  constructor(
    redisClient: RedisClient,
    workersDir: string,
    keyLock: string,
    workerParameters: WorkerParameters,
    workerPool: WorkerPool,
  ) {
    super();
    this.powerManager = new PowerManager();
    this.redisClient = redisClient;
    this.workersDir = workersDir;
    this.workerParameters = workerParameters;
    this.logger = getNamespacedLogger(this.constructor.name);
    this.lockManager = new LockManager(redisClient, keyLock, 10000, false);
    this.ticker = new Ticker(this.onTick);
    this.workerPool = workerPool;
  }

  private onTick = (): void => {
    this.lockManager.acquireLock((err, locked) => {
      if (err) this.emit(events.ERROR, err);
      else if (locked) {
        if (!this.initialized)
          this.init((err) => {
            if (err) this.emit(events.ERROR, err);
            else {
              this.initialized = true;
              this.emit(events.WORKER_RUNNER_WORKERS_STARTED);
              this.ticker.nextTick();
            }
          });
        else if (this.workerPool)
          this.workerPool.work((err) => {
            if (err) this.emit(events.ERROR, err);
            else this.ticker.nextTick();
          });
        else this.ticker.nextTick();
      } else this.ticker.nextTick();
    });
  };

  private init = (cb: ICallback<void>): void => {
    readdir(this.workersDir, undefined, (err, reply) => {
      if (err) cb(err);
      else {
        each(
          reply ?? [],
          (filename: string, _, done) => {
            if (filename.match(/\.worker\.js$/)) {
              this.addToWorkerPool(filename, done);
            } else done();
          },
          cb,
        );
      }
    });
  };

  private addToWorkerPool = (filename: string, cb: ICallback<void>): void => {
    this.createWorkerInstance(filename, (err, instance) => {
      if (err) cb(err);
      else if (!instance) cb(new EmptyCallbackReplyError());
      else if (!this.workerPool)
        cb(new PanicError(`Expected an instance of WorkerPool`));
      else {
        this.workerPool.add(instance);
        cb();
      }
    });
  };

  private createWorkerInstance = (
    filename: string,
    cb: ICallback<Worker>,
  ): void => {
    const filepath = join(this.workersDir, filename);
    import(filepath)
      .then(
        (module: { default: TWorkerClassConstructor<TWorkerParameters> }) => {
          const worker = new module.default(
            this.redisClient,
            this.workerParameters,
            true,
          );
          cb(null, worker);
        },
      )
      .catch(cb);
  };

  private clearWorkerPool = (cb: ICallback<void>): void => {
    if (this.workerPool) this.workerPool.clear(cb);
    else cb();
  };

  private stopTicker = (cb: ICallback<void>) => {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  };

  private releaseLock = (cb: ICallback<void>) => {
    this.lockManager.releaseLock(cb);
  };

  run = (): void => {
    this.powerManager.goingUp();
    this.ticker.nextTick();
    this.powerManager.commit();
    this.emit(events.UP);
  };

  quit = (cb: ICallback<void>): void => {
    this.powerManager.goingDown();
    waterfall([this.stopTicker, this.clearWorkerPool, this.releaseLock], () => {
      this.initialized = false;
      this.powerManager.commit();
      this.emit(events.DOWN);
      cb();
    });
  };
}
