/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  THeartbeatDataFn,
  IHeartbeatConfig,
  IHeartbeatPayload,
  THeartbeatEvent,
} from './types/index.js';
import { Runnable } from '../runnable/index.js';
import { IRedisClient } from '../redis-client/index.js';
import { ILogger } from '../logger/index.js';
import { ICallback } from '../async/index.js';
import { CallbackEmptyReplyError } from '../errors/index.js';
import { Backoff } from '../backoff/backoff.js';
import { ExponentialBackoff } from '../backoff/index.js';
import { Timer } from '../timer/index.js';

export class Heartbeat<T = Record<string, unknown>> extends Runnable<
  THeartbeatEvent<T>
> {
  protected static readonly MIN_HEARTBEAT_TTL = 3_000;
  protected static readonly DEFAULT_HEARTBEAT_TTL =
    Heartbeat.MIN_HEARTBEAT_TTL * 20; // 60 secs

  protected readonly redisClient: IRedisClient;
  protected readonly componentId: string;
  protected readonly componentType: string;
  protected readonly heartbeatKey: string;
  protected readonly heartbeatTTL: number;
  protected readonly heartbeatInterval: number;
  protected readonly logger: ILogger;
  protected readonly dataFn: THeartbeatDataFn<T>;

  protected timer: Timer;
  protected backoff: Backoff;

  constructor(
    redisClient: IRedisClient,
    logger: ILogger,
    config: IHeartbeatConfig,
    dataFn: THeartbeatDataFn<T>,
  ) {
    super();

    // Required fields + basic validation
    if (!config.componentId || !config.componentType || !config.heartbeatKey) {
      throw new Error(
        'Heartbeat: componentId, componentType and heartbeatKey are required',
      );
    }

    this.redisClient = redisClient;
    this.componentId = config.componentId;
    this.componentType = config.componentType;
    this.heartbeatKey = config.heartbeatKey;

    this.logger = logger.createLogger(this.constructor.name);

    //
    if (
      config.heartbeatTTL &&
      config.heartbeatTTL < Heartbeat.MIN_HEARTBEAT_TTL
    ) {
      throw new Error('heartbeatTTL must be not longer than 3000 milliseconds');
    }
    this.heartbeatTTL = config.heartbeatTTL ?? Heartbeat.DEFAULT_HEARTBEAT_TTL;
    this.heartbeatInterval = Math.floor(Math.max(1, this.heartbeatTTL / 3));

    this.backoff = new ExponentialBackoff(this.logger, { maxAttempts: 3 });
    this.timer = new Timer(this.logger);

    this.dataFn = dataFn;

    this.logger.debug(
      `Heartbeat initialized for ${this.componentType}:${this.componentId} (interval: ${this.heartbeatInterval}ms, TTL: ${this.heartbeatTTL}ms)`,
    );
  }

  // Static helpers unchanged
  static isComponentAlive(
    redisClient: IRedisClient,
    heartbeatKey: string,
    cb: ICallback<boolean>,
  ): void {
    redisClient.get(heartbeatKey, (err, heartbeat) => {
      if (err) return cb(err);
      cb(null, !!heartbeat);
    });
  }

  static areComponentsAlive(
    redisClient: IRedisClient,
    heartbeatKeys: string[],
    cb: ICallback<Record<string, boolean>>,
  ): void {
    if (!heartbeatKeys.length) return cb(null, {});

    redisClient.mget(heartbeatKeys, (err, replies = []) => {
      if (err) return cb(err);
      const result: Record<string, boolean> = {};
      heartbeatKeys.forEach((key, index) => {
        result[key] = !!replies[index];
      });
      cb(null, result);
    });
  }

  private getPayload(cb: ICallback<IHeartbeatPayload<T>>): void {
    const timestamp = Date.now();

    this.dataFn((err, data) => {
      if (err) return cb(err);
      // Allow falsy values (0, false, '', etc.); reject only explicit null/undefined
      if (data == null) {
        return cb(
          new CallbackEmptyReplyError({
            message: 'dataFn returned null/undefined',
          }),
        );
      }

      cb(null, {
        timestamp,
        componentId: this.componentId,
        componentType: this.componentType,
        data,
      });
    });
  }

  private scheduleNextBeat(): void {
    if (!this.isOperational()) {
      this.logger.debug('Not scheduling next beat – component not operational');
      return;
    }

    this.timer.schedule(() => {
      // Use backoff to execute the next beat
      this.backoff.execute(this.beat, (err, payload) => {
        if (err) return this.handleError(err);
        if (payload) {
          this.emit(
            'heartbeat.beat',
            this.componentId,
            this.componentType,
            payload.timestamp,
            payload,
          );
          this.scheduleNextBeat();
        }
      });
    }, this.heartbeatInterval);
  }

  protected beat = (cb: ICallback<IHeartbeatPayload<T>>): void => {
    if (!this.isOperational()) {
      this.logger.debug('Skipping heartbeat – component not operational');
      return;
    }

    this.getPayload((err, payload) => {
      if (err || !payload) {
        cb(err || new CallbackEmptyReplyError());
        return;
      }

      // Shutdown race protection
      if (!this.isOperational()) {
        this.logger.debug('Skipping Redis SET – shutdown in progress');
        return;
      }

      let payloadStr: string;
      try {
        payloadStr = JSON.stringify(payload);
      } catch (serializeErr) {
        cb(new Error(`Failed to serialize payload: ${serializeErr}`));
        return;
      }

      this.redisClient.set(
        this.heartbeatKey,
        payloadStr,
        { expire: { mode: 'PX', value: this.heartbeatTTL } },
        (err) => {
          if (err) return cb(err);
          cb(null, payload);
        },
      );
    });
  };

  protected override handleError(err: Error) {
    if (!this.isOperational()) return;

    this.emit('heartbeat.error', err, this.componentId, this.componentType);
    super.handleError(err);
  }

  protected override finalizeUp() {
    super.finalizeUp();
    this.emit('heartbeat.up', this.componentId, this.componentType);
    this.scheduleNextBeat();
  }

  protected override finalizeDown() {
    super.finalizeDown();
    this.emit('heartbeat.down', this.componentId, this.componentType);
  }

  protected override goingUp() {
    this.emit('heartbeat.goingUp', this.componentId, this.componentType);

    return super.goingUp().concat([
      (cb) => this.timer.run(cb),
      (cb) => this.backoff.run(cb),
      (cb: ICallback) => {
        const onHeartbeat = () => {
          cleanup();
          cb();
        };

        const onError = (err?: Error) => {
          cleanup();
          cb(err);
        };

        const cleanup = () => {
          this.removeListener('heartbeat.beat', onHeartbeat);
          this.removeListener('heartbeat.error', onError);
        };

        this.once('heartbeat.beat', onHeartbeat);
        this.once('heartbeat.error', onError);

        this.beat((err) => cb(err)); // first beat must succeed
      },
    ]);
  }

  protected override goingDown() {
    this.emit('heartbeat.goingDown', this.componentId, this.componentType);

    return [
      (cb: ICallback) => this.timer.shutdown(cb),
      (cb: ICallback) => this.backoff.shutdown(cb),
      (cb: ICallback) => {
        this.logger.debug(`Deleting heartbeat key ${this.heartbeatKey}`);
        this.redisClient.del(this.heartbeatKey, (err) => {
          if (err)
            this.logger.warn(`Error deleting heartbeat key: ${err.message}`);
          cb(); // never fail shutdown
        });
      },
    ].concat(super.goingDown());
  }
}
