import * as os from 'os';
import * as async from 'async';
import {
  ICallback,
  THeartbeatParams,
  THeartbeatPayload,
  THeartbeatPayloadData,
} from '../../../../types';
import { Ticker } from '../ticker/ticker';
import { events } from '../events';
import { RedisClient } from '../../redis-client/redis-client';
import { redisKeys } from '../redis-keys/redis-keys';
import { EventEmitter } from 'events';
import { EmptyCallbackReplyError } from '../errors/empty-callback-reply.error';
import { heartbeatRegistry } from './heartbeat-registry';

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

export class Heartbeat extends EventEmitter {
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected keyHeartbeatIndex: string;
  protected keyHeartbeatTimestamps: string;
  protected isRegistered = false;
  protected heartbeatParams: THeartbeatParams;

  constructor(params: THeartbeatParams, redisClient: RedisClient) {
    super();
    this.heartbeatParams = params;
    this.keyHeartbeatIndex = redisKeys.getGlobalKeys().keyHeartbeats;
    this.keyHeartbeatTimestamps =
      redisKeys.getGlobalKeys().keyHeartbeatTimestamps;
    this.redisClient = redisClient;
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
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
    const heartbeatParamsStr = JSON.stringify(this.heartbeatParams);
    const multi = this.redisClient.multi();
    if (!this.isRegistered) {
      heartbeatRegistry.register(
        multi,
        this.heartbeatParams.keyInstanceRegistry,
        this.heartbeatParams.instanceId,
      );
      this.isRegistered = true;
    }
    multi.hset(
      this.keyHeartbeatIndex,
      this.heartbeatParams.keyHeartbeat,
      heartbeatPayloadStr,
    );
    multi.zadd(this.keyHeartbeatTimestamps, timestamp, heartbeatParamsStr);
    this.redisClient.execMulti(multi, (err) => {
      if (err) this.emit(events.ERROR, err);
      else this.ticker.nextTick();
    });
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.ticker.once(events.DOWN, cb);
          this.ticker.quit();
        },
        (cb: ICallback<void>) =>
          Heartbeat.handleExpiredHeartbeatKeys(
            this.redisClient,
            [this.heartbeatParams],
            (err) => cb(err),
          ),
        (cb: ICallback<void>) => this.redisClient.halt(cb),
      ],
      cb,
    );
  }

  static getValidHeartbeats(
    redisClient: RedisClient,
    transform: boolean,
    cb: ICallback<
      {
        key: string;
        payload: THeartbeatPayloadData | string;
      }[]
    >,
  ): void {
    const { keyHeartbeatTimestamps, keyHeartbeats } = redisKeys.getGlobalKeys();
    const timestamp = Date.now() - 10 * 1000;
    redisClient.zrangebyscore(
      keyHeartbeatTimestamps,
      timestamp,
      '+inf',
      (err, reply) => {
        if (err) cb(err);
        else if (reply && reply.length) {
          const keys = reply.map((i) => {
            const { keyHeartbeat }: THeartbeatParams = JSON.parse(i);
            return keyHeartbeat;
          });
          redisClient.hmget(keyHeartbeats, keys, (err, res) => {
            if (err) cb(err);
            else if (!res) cb(new EmptyCallbackReplyError());
            else {
              const heartbeats = res.map((payloadStr, index) => {
                const key = keys[index];
                const payload: THeartbeatPayloadData | string = transform
                  ? JSON.parse(payloadStr)
                  : payloadStr;
                return {
                  key,
                  payload,
                };
              });
              cb(null, heartbeats);
            }
          });
        } else cb(null, []);
      },
    );
  }

  static getValidHeartbeatKeys(
    redisClient: RedisClient,
    parse: boolean,
    cb: ICallback<(THeartbeatParams | string)[]>,
  ): void {
    const { keyHeartbeatTimestamps } = redisKeys.getGlobalKeys();
    const timestamp = Date.now() - 10 * 1000;
    redisClient.zrangebyscore(
      keyHeartbeatTimestamps,
      timestamp,
      '+inf',
      (err, reply) => {
        if (err) cb(err);
        else {
          const arr = reply ?? [];
          const params: (THeartbeatParams | string)[] = parse
            ? arr.map((i) => JSON.parse(i))
            : arr;
          cb(null, params);
        }
      },
    );
  }

  static getExpiredHeartbeatsKeys(
    redisClient: RedisClient,
    parse: boolean,
    cb: ICallback<(THeartbeatParams | string)[]>,
  ): void {
    const { keyHeartbeatTimestamps } = redisKeys.getGlobalKeys();
    const timestamp = Date.now() - 10 * 1000;
    redisClient.zrangebyscore(
      keyHeartbeatTimestamps,
      '-inf',
      timestamp,
      (err, reply) => {
        if (err) cb(err);
        else {
          const arr = reply ?? [];
          const params: (THeartbeatParams | string)[] = parse
            ? arr.map((i) => JSON.parse(i))
            : arr;
          cb(null, params);
        }
      },
    );
  }

  static handleExpiredHeartbeatKeys(
    client: RedisClient,
    keyHeartBeatParams: (THeartbeatParams | string)[],
    cb: ICallback<void>,
  ): void {
    if (keyHeartBeatParams.length) {
      const { keyHeartbeats, keyHeartbeatTimestamps } =
        redisKeys.getGlobalKeys();
      const multi = client.multi();
      async.each(
        keyHeartBeatParams,
        (item, done) => {
          const {
            keyHeartbeat,
            keyInstanceRegistry,
            instanceId,
          }: THeartbeatParams =
            typeof item === 'string' ? JSON.parse(item) : item;
          const paramsStr =
            typeof item === 'string' ? item : JSON.stringify(item);
          multi.hdel(keyHeartbeats, keyHeartbeat);
          multi.zrem(keyHeartbeatTimestamps, paramsStr);
          heartbeatRegistry.unregister(multi, keyInstanceRegistry, instanceId);
          done();
        },
        () => client.execMulti(multi, (err) => cb(err)),
      );
    } else cb();
  }
}
