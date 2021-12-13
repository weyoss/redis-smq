import * as os from 'os';
import * as async from 'async';
import { ICallback } from '../../../types';
import { Ticker } from './ticker/ticker';
import { events } from './events';
import { RedisClient } from '../redis-client/redis-client';
import { redisKeys } from './redis-keys/redis-keys';
import { EventEmitter } from 'events';

const IPAddresses = getIPAddresses();

const cpuUsageStats = {
  cpuUsage: process.cpuUsage(),
  time: process.hrtime(),
};

// convert hrtime to milliseconds
function hrtime(time: number[]) {
  return time[0] * 1e3 + time[1] / 1e6;
}

// convert (user/system) usage time from micro to milliseconds
function usageTime(time: number) {
  return time / 1000;
}

function cpuUsage() {
  const currentTimestamp = process.hrtime();
  const currentCPUUsage = process.cpuUsage();
  const timestampDiff = process.hrtime(cpuUsageStats.time);
  const cpuUsageDiff = process.cpuUsage(cpuUsageStats.cpuUsage);
  cpuUsageStats.time = currentTimestamp;
  cpuUsageStats.cpuUsage = currentCPUUsage;
  return {
    percentage: (
      (usageTime(cpuUsageDiff.user + cpuUsageDiff.system) /
        hrtime(timestampDiff)) *
      100
    ).toFixed(1),
    ...cpuUsageDiff,
  };
}

function getIPAddresses() {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const netInterface in nets) {
    const addr = nets[netInterface] ?? [];
    for (const netAddr of addr) {
      if (netAddr.family === 'IPv4' && !netAddr.internal) {
        addresses.push(netAddr.address);
      }
    }
  }
  return addresses;
}

function validateOnlineTimestamp(timestamp: number) {
  const now = Date.now();
  return now - timestamp <= 10000;
}

export class Heartbeat extends EventEmitter {
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected keyHeartbeat: string;
  protected keyHeartbeatIndex: string;

  constructor(keyHeartbeat: string, redisClient: RedisClient) {
    super();
    this.keyHeartbeat = keyHeartbeat;
    this.keyHeartbeatIndex = redisKeys.getGlobalKeys().keyIndexHeartbeats;
    this.redisClient = redisClient;
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.nextTick();
  }

  protected onTick(): void {
    const usage = {
      ipAddress: IPAddresses,
      hostname: os.hostname(),
      pid: process.pid,
      ram: {
        usage: process.memoryUsage(),
        free: os.freemem(),
        total: os.totalmem(),
      },
      cpu: cpuUsage(),
    };
    const timestamp = Date.now();
    const payload = JSON.stringify({
      timestamp,
      usage,
    });
    this.redisClient.hset(
      this.keyHeartbeatIndex,
      this.keyHeartbeat,
      payload,
      (err?: Error | null) => {
        if (err) this.emit(events.ERROR, err);
        else this.ticker.nextTick();
      },
    );
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          this.ticker.once(events.DOWN, cb);
          this.ticker.quit();
        },
        (cb: ICallback<void>) =>
          Heartbeat.handleExpiredHeartbeats(
            this.redisClient,
            [this.keyHeartbeat],
            (err) => cb(err),
          ),
        (cb: ICallback<void>) => this.redisClient.halt(cb),
      ],
      cb,
    );
  }

  static getHeartbeatsByStatus(
    client: RedisClient,
    cb: ICallback<{ valid: string[]; expired: string[] }>,
  ): void {
    const { keyIndexHeartbeats } = redisKeys.getGlobalKeys();
    client.hgetall(keyIndexHeartbeats, (err, data) => {
      if (err) cb(err);
      else {
        const valid: string[] = [];
        const expired: string[] = [];
        if (data) {
          async.eachOf(
            data,
            (value, key, done) => {
              const { timestamp }: { timestamp: number } = JSON.parse(value);
              const r = validateOnlineTimestamp(timestamp);
              if (r) valid.push(String(key));
              else expired.push(String(key));
              done();
            },
            () => {
              cb(null, {
                valid,
                expired,
              });
            },
          );
        } else
          cb(null, {
            valid,
            expired,
          });
      }
    });
  }

  static isAlive(
    redisClient: RedisClient,
    keyHeartbeat: string,
    cb: ICallback<boolean>,
  ): void {
    const { keyIndexHeartbeats } = redisKeys.getGlobalKeys();
    redisClient.hget(keyIndexHeartbeats, keyHeartbeat, (err, res) => {
      if (err) cb(err);
      else if (!res) cb(null, false);
      else {
        const { timestamp }: { timestamp: number } = JSON.parse(res);
        const isOnline = validateOnlineTimestamp(timestamp);
        cb(null, isOnline);
      }
    });
  }

  static handleExpiredHeartbeats(
    client: RedisClient,
    heartbeats: string[],
    cb: ICallback<number>,
  ): void {
    if (heartbeats.length) {
      const { keyIndexHeartbeats } = redisKeys.getGlobalKeys();
      client.hdel(keyIndexHeartbeats, heartbeats, cb);
    } else cb();
  }
}
