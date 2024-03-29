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
  async,
  CallbackInvalidReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  IRedisTransaction,
  RedisClientAbstract,
  Runnable,
  Timer,
} from 'redis-smq-common';
import { TConsumerHeartbeatEvent } from '../../../common/index.js';
import { RedisClientFactory } from '../../../common/redis-client/redis-client-factory.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { EventBusRedisFactory } from '../../event-bus/event-bus-redis-factory.js';
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
  protected keyHeartbeats;
  protected keyHeartbeatTimestamps;
  protected consumer;
  protected logger;
  protected redisClient;
  protected eventBus;

  constructor(consumer: Consumer, logger: ILogger) {
    super();
    this.consumer = consumer;
    this.logger = logger;
    this.redisClient = RedisClientFactory(consumer.getId(), (err) =>
      this.handleError(err),
    );
    if (Configuration.getSetConfig().eventBus.enabled) {
      this.eventBus = EventBusRedisFactory(consumer.getId(), (err) =>
        this.handleError(err),
      );
      eventBusPublisher(this, this.consumer.getId(), this.logger);
    }
    const { keyHeartbeats, keyHeartbeatTimestamps } = redisKeys.getMainKeys();
    this.keyHeartbeats = keyHeartbeats;
    this.keyHeartbeatTimestamps = keyHeartbeatTimestamps;
    this.timer = new Timer();
    this.timer.on('error', (err) => {
      this.emit('consumerHeartbeat.error', err);
    });
  }

  protected static isExpiredHeartbeat(heartbeat: IConsumerHeartbeat): boolean {
    const { timestamp: heartbeatTimestamp } = heartbeat;
    const timestamp = Date.now() - ConsumerHeartbeat.heartbeatTTL;
    return heartbeatTimestamp > timestamp;
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
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          const heartbeatPayloadStr = JSON.stringify(heartbeatPayload);
          redisClient.hset(
            this.keyHeartbeats,
            this.consumer.getId(),
            heartbeatPayloadStr,
            (err) => cb(err),
          );
        },
        (cb: ICallback<void>) => {
          redisClient.zadd(
            this.keyHeartbeatTimestamps,
            timestamp,
            consumerId,
            (err) => cb(err),
          );
        },
      ],
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
        if (redisClient instanceof RedisClientAbstract) {
          const multi = redisClient.multi();
          ConsumerHeartbeat.handleExpiredHeartbeatId(
            this.consumer.getId(),
            multi,
          );
          multi.exec((err) => cb(err));
        }
        // ignoring errors
        else cb();
      },
    ].concat(super.goingDown());
  }

  static getConsumersHeartbeats(
    redisClient: IRedisClient,
    consumerIds: string[],
    cb: ICallback<Record<string, IConsumerHeartbeat | false>>,
  ): void {
    const keyHeartbeats = redisKeys.getMainKeys().keyHeartbeats;
    redisClient.hmget(keyHeartbeats, consumerIds, (err, reply) => {
      if (err) cb(err);
      else if (!reply || reply.length !== consumerIds.length)
        cb(new CallbackInvalidReplyError());
      else {
        const r: Record<string, IConsumerHeartbeat | false> = {};
        async.eachOf(
          consumerIds,
          (item, index, done) => {
            const payload = reply[index];
            if (payload) {
              const consumerHeartbeat: IConsumerHeartbeat = JSON.parse(payload);
              r[consumerIds[index]] = this.isExpiredHeartbeat(consumerHeartbeat)
                ? consumerHeartbeat
                : false;
            } else r[consumerIds[index]] = false;
            done();
          },
          () => cb(null, r),
        );
      }
    });
  }

  static getExpiredHeartbeatIds(
    redisClient: IRedisClient,
    offset: number,
    count: number,
    cb: ICallback<string[]>,
  ): void {
    const { keyHeartbeatTimestamps } = redisKeys.getMainKeys();
    const ts = Date.now() - ConsumerHeartbeat.heartbeatTTL;
    redisClient.zrangebyscore(
      keyHeartbeatTimestamps,
      '-inf',
      ts,
      offset,
      count,
      (err, consumerIds) => {
        if (err) cb(err);
        else cb(null, consumerIds ?? []);
      },
    );
  }

  static handleExpiredHeartbeatId(
    consumerId: string | string[],
    multi: IRedisTransaction,
  ): void {
    const { keyHeartbeats, keyHeartbeatTimestamps } = redisKeys.getMainKeys();
    const ids = typeof consumerId === 'string' ? [consumerId] : consumerId;
    ids.forEach((consumerId) => {
      multi.hdel(keyHeartbeats, consumerId);
      multi.zrem(keyHeartbeatTimestamps, consumerId);
    });
  }
}
