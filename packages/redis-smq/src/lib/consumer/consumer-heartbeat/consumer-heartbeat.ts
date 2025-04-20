/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as os from 'os';
import {
  ICallback,
  ILogger,
  IRedisClient,
  logger,
  Runnable,
  Timer,
} from 'redis-smq-common';
import { TConsumerHeartbeatEvent } from '../../../common/index.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { EventBus } from '../../event-bus/index.js';
import { Consumer } from '../consumer/consumer.js';
import { IConsumerHeartbeat } from '../types/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';

const cpuUsageStatsRef = {
  cpuUsage: process.cpuUsage(),
  time: process.hrtime(),
};

function cpuUsage() {
  const currentTimestamp = process.hrtime();
  const currentCPUUsage = process.cpuUsage();
  const timestampDiff = process.hrtime(cpuUsageStatsRef.time);
  const cpuUsageDiff = process.cpuUsage(cpuUsageStatsRef.cpuUsage);
  cpuUsageStatsRef.time = currentTimestamp;
  cpuUsageStatsRef.cpuUsage = currentCPUUsage;

  // convert hrtime to milliseconds
  const hrtime = (time: number[]) => {
    return time[0] * 1e3 + time[1] / 1e6;
  };

  // convert (user/system) usage time from micro to milliseconds
  const usageTime = (time: number) => {
    return time / 1000;
  };

  return {
    percentage: (
      (usageTime(cpuUsageDiff.user + cpuUsageDiff.system) /
        hrtime(timestampDiff)) *
      100
    ).toFixed(1),
    ...cpuUsageDiff,
  };
}

export class ConsumerHeartbeat extends Runnable<TConsumerHeartbeatEvent> {
  protected static readonly heartbeatTTL = 10 * 1000; // 10 sec
  protected timer;
  protected keyConsumerHeartbeat;
  protected consumer;
  protected logger;
  protected redisClient;

  constructor(
    consumer: Consumer,
    redisClient: RedisClient,
    eventBus: EventBus | null,
  ) {
    super();
    this.consumer = consumer;
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.redisClient = redisClient;

    this.logger.debug(
      `Initializing ConsumerHeartbeat for consumer ${consumer.getId()}`,
    );

    if (eventBus) {
      this.logger.debug('Event bus provided, setting up event bus publisher');
      eventBusPublisher(this, eventBus, this.logger);
    } else {
      this.logger.debug(
        'No event bus provided, skipping event bus publisher setup',
      );
    }

    const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(
      consumer.getId(),
    );
    this.keyConsumerHeartbeat = keyConsumerHeartbeat;
    this.logger.debug(`Consumer heartbeat key: ${this.keyConsumerHeartbeat}`);

    this.timer = new Timer();
    this.timer.on('error', (err) => {
      this.logger.error(`Timer error: ${err.message}`);
      this.emit('consumerHeartbeat.error', err);
    });

    this.logger.info(
      `ConsumerHeartbeat initialized for consumer ${consumer.getId()}`,
    );
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected getPayload(): IConsumerHeartbeat {
    this.logger.debug('Generating heartbeat payload');
    const timestamp = Date.now();
    const payload = {
      timestamp,
      data: {
        ram: {
          usage: process.memoryUsage(),
          free: os.freemem(),
          total: os.totalmem(),
        },
        cpu: cpuUsage(),
      },
    };
    this.logger.debug(
      `Heartbeat payload generated with timestamp ${timestamp}`,
    );
    return payload;
  }

  protected beat(): void {
    this.logger.debug('Starting heartbeat cycle');
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error(
        `Failed to get Redis client instance: ${redisClient.message}`,
      );
      this.emit('consumerHeartbeat.error', redisClient);
      return void 0;
    }

    const heartbeatPayload = this.getPayload();
    const consumerId = this.consumer.getId();
    const timestamp = Date.now();
    const heartbeatPayloadStr = JSON.stringify(heartbeatPayload);

    this.logger.debug(
      `Setting heartbeat in Redis with TTL ${ConsumerHeartbeat.heartbeatTTL}ms`,
    );
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
        if (err) {
          this.logger.error(`Failed to set heartbeat in Redis: ${err.message}`);
          this.emit('consumerHeartbeat.error', err);
        } else {
          this.logger.debug(
            `Heartbeat successfully set in Redis for consumer ${consumerId}`,
          );
          this.emit(
            'consumerHeartbeat.heartbeat',
            consumerId,
            timestamp,
            heartbeatPayload,
          );

          this.logger.debug('Scheduling next heartbeat in 1000ms');
          this.timer.setTimeout(() => this.beat(), 1000);
        }
      },
    );
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info('ConsumerHeartbeat going up');
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        this.logger.debug('Setting up initial heartbeat');

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

        this.logger.debug('Initiating first heartbeat');
        this.beat();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.info('ConsumerHeartbeat going down');
    return [
      (cb: ICallback<void>) => {
        this.logger.debug('Resetting timer');
        this.timer.reset();

        const redisClient = this.redisClient.getInstance();
        // ignoring errors
        if (redisClient instanceof Error) {
          this.logger.warn(
            `Could not get Redis client during shutdown: ${redisClient.message}`,
          );
          return cb();
        }

        this.logger.debug(
          `Deleting heartbeat key ${this.keyConsumerHeartbeat} from Redis`,
        );
        redisClient.del(this.keyConsumerHeartbeat, (err) => {
          if (err) {
            this.logger.warn(
              `Error deleting heartbeat key: ${err.message} (ignoring)`,
            );
          } else {
            this.logger.debug('Heartbeat key successfully deleted from Redis');
          }
          cb();
        });
      },
    ].concat(super.goingDown());
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
}
