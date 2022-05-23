import * as os from 'os';
import {
  ICallback,
  THeartbeatPayload,
  THeartbeatPayloadData,
} from '../../../types';
import { Ticker } from '../../common/ticker/ticker';
import { events } from '../../common/events/events';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { InvalidCallbackReplyError } from '../../common/errors/invalid-callback-reply.error';
import { Consumer } from './consumer';
import { each, waterfall } from '../../common/async/async';

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
  protected consumerId: string;

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super();
    this.redisClient = redisClient;
    this.consumerId = consumer.getId();
    const { keyHeartbeats } = consumer.getRedisKeys();
    this.keyHeartbeats = keyHeartbeats;
    this.keyHeartbeatTimestamps =
      redisKeys.getMainKeys().keyHeartbeatConsumerWeight;
    this.ticker = new Ticker(() => this.onTick());
    this.ticker.nextTick();
  }

  protected getPayload(): THeartbeatPayload {
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
    multi.hset(this.keyHeartbeats, this.consumerId, heartbeatPayloadStr);
    multi.zadd(this.keyHeartbeatTimestamps, timestamp, this.consumerId);
    this.redisClient.execMulti(multi, (err) => {
      if (err) this.emit(events.ERROR, err);
      else {
        this.emit(
          events.HEARTBEAT_TICK,
          timestamp,
          this.consumerId,
          heartbeatPayload,
        );
        this.ticker.nextTick();
      }
    });
  }

  quit(cb: ICallback<void>): void {
    waterfall(
      [
        (cb: ICallback<void>) => {
          this.ticker.once(events.DOWN, cb);
          this.ticker.quit();
        },
        (cb: ICallback<void>) =>
          ConsumerHeartbeat.handleExpiredHeartbeatIds(
            this.redisClient,
            [this.consumerId],
            (err) => cb(err),
          ),
        (cb: ICallback<void>) => this.redisClient.halt(cb),
      ],
      cb,
    );
  }

  static validateHeartbeatsOf(
    redisClient: RedisClient,
    consumerIds: string[],
    cb: ICallback<Record<string, boolean>>,
  ): void {
    const keyHeartbeats = redisKeys.getMainKeys().keyHeartbeats;
    redisClient.hmget(keyHeartbeats, consumerIds, (err, reply) => {
      if (err) cb(err);
      else if (!reply || reply.length !== consumerIds.length)
        cb(new InvalidCallbackReplyError());
      else {
        const r: Record<string, boolean> = {};
        each(
          consumerIds,
          (item, index, done) => {
            const idx = Number(index);
            const payload = reply[idx];
            if (payload) {
              const { timestamp: heartbeatTimestamp }: THeartbeatPayload =
                JSON.parse(payload);
              const timestamp = Date.now() - ConsumerHeartbeat.heartbeatTTL;
              r[consumerIds[idx]] = heartbeatTimestamp > timestamp;
            } else r[consumerIds[idx]] = false;
            done();
          },
          () => cb(null, r),
        );
      }
    });
  }

  static getValidHeartbeats(
    redisClient: RedisClient,
    transform: boolean,
    cb: ICallback<
      {
        consumerId: string;
        payload: THeartbeatPayloadData | string;
      }[]
    >,
  ): void {
    const { keyHeartbeatConsumerWeight, keyHeartbeats } =
      redisKeys.getMainKeys();
    const timestamp = Date.now() - ConsumerHeartbeat.heartbeatTTL;
    redisClient.zrangebyscore(
      keyHeartbeatConsumerWeight,
      timestamp,
      '+inf',
      (err, consumerIds) => {
        if (err) cb(err);
        else if (consumerIds && consumerIds.length) {
          redisClient.hmget(keyHeartbeats, consumerIds, (err, res) => {
            if (err) cb(err);
            else if (!res || res.length !== consumerIds.length)
              cb(new EmptyCallbackReplyError());
            else {
              const heartbeats: {
                consumerId: string;
                payload: THeartbeatPayloadData | string;
              }[] = [];
              each(
                res,
                (payloadStr, index, done) => {
                  // A consumer/producer could go offline at the time while we are processing heartbeats
                  // If a heartbeat is not found, do not return an error. Just skip it.
                  if (payloadStr) {
                    const idx = Number(index);
                    const consumerId = consumerIds[idx];
                    const payload: THeartbeatPayloadData | string = transform
                      ? JSON.parse(payloadStr)
                      : payloadStr;
                    heartbeats.push({
                      consumerId,
                      payload,
                    });
                    done();
                  } else done();
                },
                (err) => {
                  if (err) cb(err);
                  else cb(null, heartbeats);
                },
              );
            }
          });
        } else cb(null, []);
      },
    );
  }

  static getValidHeartbeatIds(
    redisClient: RedisClient,
    cb: ICallback<string[]>,
  ): void {
    const { keyHeartbeatConsumerWeight } = redisKeys.getMainKeys();
    const timestamp = Date.now() - ConsumerHeartbeat.heartbeatTTL;
    redisClient.zrangebyscore(
      keyHeartbeatConsumerWeight,
      timestamp,
      '+inf',
      (err, consumerIds) => {
        if (err) cb(err);
        else cb(null, consumerIds ?? []);
      },
    );
  }

  static getExpiredHeartbeatIds(
    redisClient: RedisClient,
    cb: ICallback<string[]>,
  ): void {
    const { keyHeartbeatConsumerWeight } = redisKeys.getMainKeys();
    const timestamp = Date.now() - ConsumerHeartbeat.heartbeatTTL;
    redisClient.zrangebyscore(
      keyHeartbeatConsumerWeight,
      '-inf',
      timestamp,
      (err, consumerIds) => {
        if (err) cb(err);
        else cb(null, consumerIds ?? []);
      },
    );
  }

  static handleExpiredHeartbeatIds(
    redisClient: RedisClient,
    consumerIds: string[],
    cb: ICallback<void>,
  ): void {
    if (consumerIds.length) {
      const { keyHeartbeats, keyHeartbeatConsumerWeight } =
        redisKeys.getMainKeys();
      const multi = redisClient.multi();
      each(
        consumerIds,
        (consumerId, _, done) => {
          multi.hdel(keyHeartbeats, consumerId);
          multi.zrem(keyHeartbeatConsumerWeight, consumerId);
          Consumer.handleOfflineConsumer(multi, redisClient, consumerId, done);
        },
        () => redisClient.execMulti(multi, (err) => cb(err)),
      );
    } else cb();
  }
}
