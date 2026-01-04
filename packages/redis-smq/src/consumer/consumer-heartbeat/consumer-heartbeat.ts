/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as os from 'os';
import {
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  Runnable,
  Timer,
} from 'redis-smq-common';
import { TConsumerHeartbeatEvent } from '../../common/index.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { eventPublisher } from './event-publisher.js';
import { IConsumerHeartbeat } from './types/index.js';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { IConsumerContext } from '../types/consumer-context.js';

/**
 * ConsumerHeartbeat
 * - Emits periodic heartbeats with RAM/CPU stats
 * - Persists heartbeat to Redis with TTL
 * - Reschedules reliably even on transient errors (exponential backoff)
 * - Uses a single timestamp source for payload and event emission
 */
export class ConsumerHeartbeat extends Runnable<TConsumerHeartbeatEvent> {
  protected static readonly heartbeatTTL = 10 * 1000; // 10 sec
  protected static readonly baseBeatIntervalMs = 1000; // nominal cadence
  protected static readonly maxBackoffMs = 10_000; // cap for error backoff

  protected readonly consumerContext: IConsumerContext;
  protected timer: Timer;
  protected keyConsumerHeartbeat: string;
  protected logger: ILogger;

  // Instance-local CPU usage trackers to avoid cross-talk between instances/tests
  private cpuStatsTime = process.hrtime();
  private cpuStatsUsage = process.cpuUsage();

  // Backoff state for resilient rescheduling
  private currentDelayMs = ConsumerHeartbeat.baseBeatIntervalMs;

  constructor(consumerContext: IConsumerContext) {
    super();
    this.consumerContext = consumerContext;

    this.logger = this.consumerContext.logger.createLogger(
      this.constructor.name,
    );
    this.logger.debug(`Initializing ConsumerHeartbeat...`);

    this.logger.debug('Inittializing eventPublisher...');
    eventPublisher(this);

    const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(
      this.consumerContext.consumerId,
    );
    this.keyConsumerHeartbeat = keyConsumerHeartbeat;
    this.logger.debug(`Consumer heartbeat key: ${this.keyConsumerHeartbeat}`);

    this.timer = new Timer();
    this.timer.on('error', (err) => {
      this.logger.error(`Timer error: ${err.message}`);
      this.emit('consumerHeartbeat.error', err);
    });

    this.logger.info(`ConsumerHeartbeat initialized`);
  }

  static isConsumerAlive(
    redisClient: IRedisClient,
    consumerId: string,
    cb: ICallback<boolean>,
  ): void {
    const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(consumerId);
    redisClient.get(keyConsumerHeartbeat, (err, heartbeat) => {
      if (err) return cb(err);
      const isAlive = !!heartbeat;
      cb(null, isAlive);
    });
  }

  static isConsumerListAlive(
    redisClient: IRedisClient,
    consumerIds: string[],
    cb: ICallback<Record<string, boolean>>,
  ): void {
    if (!consumerIds.length) {
      cb(null, {});
      return;
    }
    const heartbeatKeys = consumerIds.map((id) => {
      const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(id);
      return keyConsumerHeartbeat;
    });
    redisClient.mget(heartbeatKeys, (err, replies) => {
      if (err) return cb(err);
      if (!replies) return cb(new CallbackEmptyReplyError());
      const result: Record<string, boolean> = {};
      consumerIds.forEach((id, index) => {
        result[id] = !!replies[index];
      });
      cb(null, result);
    });
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Compute CPU usage percentage since the last call (instance-local).
   */
  private getCpuUsage() {
    const nowTime = process.hrtime();
    const nowUsage = process.cpuUsage();

    const diffTime = process.hrtime(this.cpuStatsTime);
    const diffUsage = process.cpuUsage(this.cpuStatsUsage);

    // Update references for next measurement
    this.cpuStatsTime = nowTime;
    this.cpuStatsUsage = nowUsage;

    const hrtimeMs = (t: [number, number]) => t[0] * 1e3 + t[1] / 1e6; // seconds,nanoseconds -> ms
    const usageMs = (u: number) => u / 1000; // microseconds -> ms

    const totalCpuMs = usageMs(diffUsage.user + diffUsage.system);
    const elapsedMs = hrtimeMs(diffTime);
    const percentage =
      elapsedMs > 0 ? ((totalCpuMs / elapsedMs) * 100).toFixed(1) : '0.0';

    return {
      percentage,
      ...diffUsage,
    };
  }

  protected getPayload(): IConsumerHeartbeat {
    // this.logger.debug('Generating heartbeat payload');
    const timestamp = Date.now();
    return {
      timestamp,
      data: {
        ram: {
          usage: process.memoryUsage(),
          free: os.freemem(),
          total: os.totalmem(),
        },
        cpu: this.getCpuUsage(),
      },
    };
  }

  /**
   * Schedule the next beat respecting Timer semantics and current backoff.
   * Ensures we don't schedule while going down.
   */
  private scheduleNextBeat(): void {
    if (!this.isRunning()) {
      this.logger.debug(
        'Skipping scheduling next heartbeat because the instance is not running or is going down',
      );
      return;
    }
    const delay = this.currentDelayMs;
    // this.logger.debug(`Scheduling next heartbeat in ${delay}ms`);
    const scheduled = this.timer.setTimeout(() => this.beat(), delay);
    if (!scheduled) {
      // Timer already armed; reset and try once more
      this.logger.debug(
        'Timer was already armed; resetting and rescheduling heartbeat',
      );
      this.timer.reset();
      this.timer.setTimeout(() => this.beat(), delay);
    }
  }

  protected beat(): void {
    if (!this.isRunning() || this.isGoingDown()) {
      // Do not perform beats while not running/shutting down
      this.logger.debug(
        'Skipping heartbeat beat() because the instance is not running or is going down',
      );
      return;
    }

    //this.logger.debug('Starting heartbeat cycle');
    withSharedPoolConnection(
      (redisClient, cb: ICallback) => {
        const heartbeatPayload = this.getPayload();
        const consumerId = this.consumerContext.consumerId;
        // Use the exact payload timestamp for the event
        const timestamp = heartbeatPayload.timestamp;
        const heartbeatPayloadStr = JSON.stringify(heartbeatPayload);

        // this.logger.debug(
        //   `Setting heartbeat in Redis with TTL ${ConsumerHeartbeat.heartbeatTTL}ms`,
        // );
        redisClient.set(
          this.keyConsumerHeartbeat,
          heartbeatPayloadStr,
          {
            expire: {
              mode: 'PX',
              value: ConsumerHeartbeat.heartbeatTTL,
            },
          },
          (err) => {
            if (err) return cb(err);
            // this.logger.debug(
            //   `Heartbeat successfully set in Redis for consumer ${consumerId}`,
            // );
            // Success: reset backoff to base
            this.currentDelayMs = ConsumerHeartbeat.baseBeatIntervalMs;

            this.emit(
              'consumerHeartbeat.heartbeat',
              consumerId,
              timestamp,
              heartbeatPayload,
            );

            cb();
          },
        );
      },
      (err) => {
        if (err) {
          this.logger.error(`Failed to set heartbeat in Redis: ${err.message}`);
          this.emit('consumerHeartbeat.error', err);

          // Back off exponentially on error (up to cap)
          this.currentDelayMs = Math.min(
            this.currentDelayMs * 2,
            ConsumerHeartbeat.maxBackoffMs,
          );
        } else {
          // Ensure delay is base if there was no error in callback path
          this.currentDelayMs = ConsumerHeartbeat.baseBeatIntervalMs;
        }

        // Always attempt to schedule the next beat unless we're going down
        this.scheduleNextBeat();
      },
    );
  }

  protected override goingUp(): ((cb: ICallback) => void)[] {
    this.logger.info('ConsumerHeartbeat going up');
    return super.goingUp().concat([
      (cb: ICallback) => {
        // this.logger.debug('Setting up initial heartbeat');
        const cleanUp = () => {
          this.logger.debug('Cleaning up heartbeat listeners');
          this.removeListener('consumerHeartbeat.heartbeat', onHeartbeat);
          this.removeListener('consumerHeartbeat.error', onError);
        };

        const onError = (err?: Error) => {
          this.logger.error(`Error during initial heartbeat: ${err?.message}`);
          cleanUp();
          cb(err);
        };

        const onHeartbeat = () => {
          this.logger.debug('Initial heartbeat successful');
          cleanUp();
          cb();
        };

        this.once('consumerHeartbeat.heartbeat', onHeartbeat);
        this.once('consumerHeartbeat.error', onError);

        // Reset backoff at start
        this.currentDelayMs = ConsumerHeartbeat.baseBeatIntervalMs;

        // this.logger.debug('Initiating first heartbeat');
        this.beat();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    this.logger.info('ConsumerHeartbeat going down');
    return [
      (cb: ICallback) => {
        this.logger.debug('Resetting timer');
        this.timer.reset();

        withSharedPoolConnection(
          (redisClient, cbInner: ICallback) => {
            this.logger.debug(
              `Deleting heartbeat key ${this.keyConsumerHeartbeat} from Redis`,
            );
            redisClient.del(this.keyConsumerHeartbeat, (err) => {
              if (err) return cbInner(err);
              this.logger.debug(
                `Deleted successfully heartbeat key ${this.keyConsumerHeartbeat} from Redis`,
              );
              cbInner();
            });
          },
          (err) => {
            // Ignoring errors. Just warn
            if (err)
              this.logger.warn(
                `Error shutting down consumer heartbeat: ${err}`,
              );
            cb();
          },
        );
      },
    ].concat(super.goingDown());
  }
}
