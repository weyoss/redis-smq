import {
  CallbackEmptyReplyError,
  createLogger,
  Heartbeat,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
} from 'redis-smq-common';
import { WorkerAbstract as Worker } from '../workers/worker-abstract.js';
import { Pool } from '../redis/connection-pool/pool.js';
import { ERedisConnectionAcquisitionMode } from '../redis/connection-pool/types/connection-pool.js';
import { keys } from '../redis/keys/keys.js';
import { IWorkerPayload } from '../workers/types/worker.js';

export abstract class WorkerAbstract extends Worker {
  protected override logger: ILogger;
  protected redisClient: IRedisClient | null = null;
  protected heartbeat: Heartbeat | null = null;

  protected constructor(payload: IWorkerPayload) {
    super(payload);
    this.logger = createLogger(payload.config.logger, [
      ...payload.loggerContext.namespaces,
      this.constructor.name,
    ]);
    this.logger.debug(`Worker ${this.constructor.name} initialized.`);
  }

  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    if (!this.redisClient)
      return cb(
        new PanicError({
          message: 'Redis client is not initialized',
        }),
      );

    try {
      const { keyWorkerHeartbeat } = keys.getWorkerKeys(this.id);
      this.heartbeat = new Heartbeat(this.redisClient, this.logger, {
        heartbeatKey: keyWorkerHeartbeat,
        componentId: this.id,
        componentType: this.constructor.name,
      });
      this.heartbeat.run(cb);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      cb(err);
    }
  };

  protected shutdownHeartbeat = (cb: ICallback): void => {
    if (this.heartbeat) {
      return this.heartbeat.shutdown((err) => {
        this.heartbeat = null;
        cb(err);
      });
    }
    cb();
  };

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback) => {
        Pool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            this.redisClient = redisClient;
            cb();
          },
        );
      },
      this.setUpHeartbeat,
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      this.shutdownHeartbeat,
      (cb: ICallback) => {
        if (this.redisClient) {
          Pool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }

  protected getRedisClient(): IRedisClient {
    if (!this.redisClient)
      throw new PanicError({ message: 'A Client instance is required.' });
    return this.redisClient;
  }
}
