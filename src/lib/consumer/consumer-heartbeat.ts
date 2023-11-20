/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as os from 'os';
import { IConsumerHeartbeat } from '../../../types';
import {
  RedisClient,
  Ticker,
  async,
  ICallback,
  IRedisTransaction,
  CallbackInvalidReplyError,
} from 'redis-smq-common';
import { events } from '../../common/events/events';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { Consumer } from './consumer';

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

export class ConsumerHeartbeat extends EventEmitter {
  protected static readonly heartbeatTTL = 10 * 1000; // 10 sec
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected keyHeartbeats: string;
  protected keyHeartbeatTimestamps: string;
  protected consumer: Consumer;

  constructor(
    redisClient: RedisClient,
    consumer: Consumer,
    redisKeys: {
      keyHeartbeats: string;
      keyHeartbeatConsumerWeight: string;
    },
  ) {
    super();
    this.redisClient = redisClient;
    this.consumer = consumer;
    this.keyHeartbeats = redisKeys.keyHeartbeats;
    this.keyHeartbeatTimestamps = redisKeys.keyHeartbeatConsumerWeight;
    this.ticker = new Ticker(() => this.onTick());
    this.ticker.nextTick();
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

  protected onTick(): void {
    const timestamp = Date.now();
    const heartbeatPayload = this.getPayload();
    const heartbeatPayloadStr = JSON.stringify(heartbeatPayload);
    const multi = this.redisClient.multi();
    multi.hset(this.keyHeartbeats, this.consumer.getId(), heartbeatPayloadStr);
    multi.zadd(this.keyHeartbeatTimestamps, timestamp, this.consumer.getId());
    multi.exec((err) => {
      if (err) this.emit(events.ERROR, err);
      else {
        this.emit(
          events.TICK,
          timestamp,
          this.consumer.getId(),
          heartbeatPayload,
        );
        this.ticker.nextTick();
      }
    });
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.ticker.once(events.DOWN, cb);
          this.ticker.quit();
        },
        (cb: ICallback<void>) => {
          const multi = this.redisClient.multi();
          ConsumerHeartbeat.handleExpiredHeartbeatId(
            this.consumer.getId(),
            multi,
          );
          multi.exec((err) => cb(err));
        },
        (cb: ICallback<void>) => this.redisClient.halt(cb),
      ],
      cb,
    );
  }

  protected static isExpiredHeartbeat(heartbeat: IConsumerHeartbeat): boolean {
    const { timestamp: heartbeatTimestamp } = heartbeat;
    const timestamp = Date.now() - ConsumerHeartbeat.heartbeatTTL;
    return heartbeatTimestamp > timestamp;
  }

  static getConsumersHeartbeats(
    redisClient: RedisClient,
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
    redisClient: RedisClient,
    offset: number,
    count: number,
    cb: ICallback<string[]>,
  ): void {
    const { keyHeartbeatConsumerWeight } = redisKeys.getMainKeys();
    const ts = Date.now() - ConsumerHeartbeat.heartbeatTTL;
    redisClient.zrangebyscore(
      keyHeartbeatConsumerWeight,
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
    const { keyHeartbeats, keyHeartbeatConsumerWeight } =
      redisKeys.getMainKeys();
    const ids = typeof consumerId === 'string' ? [consumerId] : consumerId;
    ids.forEach((consumerId) => {
      multi.hdel(keyHeartbeats, consumerId);
      multi.zrem(keyHeartbeatConsumerWeight, consumerId);
    });
  }
}
