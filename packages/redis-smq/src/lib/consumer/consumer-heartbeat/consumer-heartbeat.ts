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
  Runnable,
  Timer,
} from 'redis-smq-common';
import { TConsumerHeartbeatEvent } from '../../../common/index.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
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
    logger: ILogger,
    eventBus: EventBus | null,
  ) {
    super();
    this.consumer = consumer;
    this.logger = logger;
    this.redisClient = redisClient;
    if (eventBus) {
      eventBusPublisher(this, eventBus, this.logger);
    }
    const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(
      consumer.getId(),
    );
    this.keyConsumerHeartbeat = keyConsumerHeartbeat;
    this.timer = new Timer();
    this.timer.on('error', (err) => {
      this.emit('consumerHeartbeat.error', err);
    });
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected getPayload(): IConsumerHeartbeat {
    const timestamp = Date.now();
    return {
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
  }

  protected beat(): void {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.emit('consumerHeartbeat.error', redisClient);
      return void 0;
    }
    const heartbeatPayload = this.getPayload();
    const consumerId = this.consumer.getId();
    const timestamp = Date.now();
    const heartbeatPayloadStr = JSON.stringify(heartbeatPayload);
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
        if (err) this.emit('consumerHeartbeat.error', err);
        else {
          this.emit(
            'consumerHeartbeat.heartbeat',
            consumerId,
            timestamp,
            heartbeatPayload,
          );
          this.timer.setTimeout(() => this.beat(), 1000);
        }
      },
    );
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        const cleanUp = () => {
          this.removeListener('consumerHeartbeat.heartbeat', onHeartbeat);
          this.removeListener('consumerHeartbeat.error', onError);
        };
        const onError = (err?: Error) => {
          cleanUp();
          cb(err);
        };
        const onHeartbeat = () => {
          cleanUp();
          cb();
        };
        this.once('consumerHeartbeat.heartbeat', onHeartbeat);
        this.once('consumerHeartbeat.error', onError);
        this.beat();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback<void>) => {
        this.timer.reset();
        const redisClient = this.redisClient.getInstance();
        // ignoring errors
        if (redisClient instanceof Error) return cb();
        redisClient.del(this.keyConsumerHeartbeat, () => cb());
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
      if (err) cb(err);
      else cb(null, !!heartbeat);
    });
  }
}
