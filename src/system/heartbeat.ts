import * as os from 'os';
import * as async from 'async';
import { ICallback, IConfig } from '../../types';
import { Ticker } from './ticker';
import { ChildProcess, fork } from 'child_process';
import { resolve } from 'path';
import { events } from './events';
import { RedisClient } from './redis-client/redis-client';
import { redisKeys } from './redis-keys';
import { Consumer } from '../consumer';
import { EventEmitter } from 'events';

type TGetHeartbeatReply = Record<
  string,
  {
    ns: string;
    queueName: string;
    consumerId: string;
    resources: Record<string, any>;
  }
>;

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

function fetchHeartbeats(
  client: RedisClient,
  cb: ICallback<Record<string, string>>,
) {
  const { keyIndexHeartbeats } = redisKeys.getGlobalKeys();
  client.hgetall(keyIndexHeartbeats, cb);
}

function getConsumerHeartbeat(
  client: RedisClient,
  id: string,
  queueName: string,
  cb: ICallback<string>,
) {
  const { keyHeartbeat, keyIndexHeartbeats } = redisKeys.getInstanceKeys(
    queueName,
    id,
  );
  client.hget(keyIndexHeartbeats, keyHeartbeat, cb);
}

export class Heartbeat extends EventEmitter {
  protected consumer: Consumer;
  protected queueName: string;
  protected consumerId: string;
  protected config: IConfig;
  protected redisKeys: ReturnType<typeof redisKeys['getInstanceKeys']>;
  protected redisClient: RedisClient;
  protected monitorThread: ChildProcess | null = null;
  protected ticker: Ticker;

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super();
    this.consumer = consumer;
    this.queueName = consumer.getQueueName();
    this.consumerId = consumer.getId();
    this.config = consumer.getConfig();
    this.redisKeys = consumer.getRedisKeys();
    this.redisClient = redisClient;
    this.startMonitor();
    this.ticker = new Ticker(() => {
      this.onTick();
    }, 1000);
    this.ticker.nextTick();
  }

  protected startMonitor(): void {
    this.monitorThread = fork(resolve(`${__dirname}/heartbeat-monitor.js`));
    this.monitorThread.on('error', (err) => {
      this.consumer.emit(events.ERROR, err);
    });
    this.monitorThread.on('exit', (code, signal) => {
      this.consumer.emit(
        events.ERROR,
        new Error(
          `statsAggregatorThread exited with code ${code} and signal ${signal}`,
        ),
      );
    });
    process.on('exit', () => {
      if (this.monitorThread) this.monitorThread.kill();
    });
    this.monitorThread.send(JSON.stringify(this.config));
  }

  protected stopMonitor(cb: ICallback<void>): void {
    if (this.monitorThread) {
      this.monitorThread.once('exit', cb);
      this.monitorThread.kill('SIGHUP');
      this.monitorThread = null;
    }
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
    const { keyIndexHeartbeats, keyHeartbeat } = this.redisKeys;
    this.redisClient.hset(
      keyIndexHeartbeats,
      keyHeartbeat,
      payload,
      (err?: Error | null) => {
        if (err) this.consumer.emit(events.ERROR, err);
        else this.ticker.nextTick();
      },
    );
  }

  protected expireHeartbeat(client: RedisClient, cb: ICallback<void>): void {
    const { keyHeartbeat } = this.redisKeys;
    Heartbeat.handleExpiredHeartbeat(client, [keyHeartbeat], (err) => cb(err));
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, () => {
      this.stopMonitor(() =>
        this.expireHeartbeat(this.redisClient, () => {
          cb();
        }),
      );
    });
    this.ticker.quit();
  }

  static getHeartbeatsByStatus(
    client: RedisClient,
    cb: ICallback<{ valid: string[]; expired: string[] }>,
  ): void {
    fetchHeartbeats(client, (err, data) => {
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
    {
      client,
      queueName,
      id,
    }: {
      client: RedisClient;
      queueName: string;
      id: string;
    },
    cb: ICallback<boolean>,
  ): void {
    getConsumerHeartbeat(client, id, queueName, (err, res) => {
      if (err) cb(err);
      else {
        let online = false;
        if (res) {
          const { timestamp }: { timestamp: number } = JSON.parse(res);
          online = validateOnlineTimestamp(timestamp);
        }
        cb(null, online);
      }
    });
  }

  static handleExpiredHeartbeat(
    client: RedisClient,
    heartbeats: string[],
    cb: ICallback<number>,
  ): void {
    if (heartbeats.length) {
      const { keyIndexHeartbeats } = redisKeys.getGlobalKeys();
      client.hdel(keyIndexHeartbeats, heartbeats, cb);
    } else cb();
  }

  static getHeartbeats(
    client: RedisClient,
    cb: ICallback<TGetHeartbeatReply>,
  ): void {
    fetchHeartbeats(client, (err, data) => {
      if (err) cb(err);
      else {
        const result: TGetHeartbeatReply = {};
        if (data) {
          async.eachOf(
            data,
            (value, key, done) => {
              const { usage: resources }: { usage: Record<string, any> } =
                JSON.parse(value);
              const extractedData = redisKeys.extractData(`${key}`);
              if (!extractedData || !extractedData.consumerId) {
                done(new Error(`Invalid extracted consumer data`));
              } else {
                const { ns, queueName, consumerId } = extractedData;
                result[consumerId] = { ns, queueName, consumerId, resources };
                done();
              }
            },
            (err) => {
              if (err) cb(err);
              else cb(null, result);
            },
          );
        } else cb(null, result);
      }
    });
  }
}
