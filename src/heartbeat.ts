import * as os from 'os';
import * as async from 'async';
import { ICallback, IConfig, TUnaryFunction } from '../types';
import { PowerManager } from './power-manager';
import { Ticker } from './ticker';
import { ChildProcess, fork } from 'child_process';
import { resolve } from 'path';
import { events } from './events';
import { RedisClient } from './redis-client';
import { redisKeys } from './redis-keys';
import { Consumer } from './consumer';

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
  const { keyIndexHeartbeat } = redisKeys.getGlobalKeys();
  client.hgetall(keyIndexHeartbeat, cb);
}

function getConsumerHeartbeat(
  client: RedisClient,
  id: string,
  queueName: string,
  cb: ICallback<string>,
) {
  const { keyConsumerHeartbeat, keyIndexHeartbeat } = redisKeys.getInstanceKeys(
    queueName,
    id,
  );
  client.hget(keyIndexHeartbeat, keyConsumerHeartbeat, cb);
}

export class Heartbeat {
  protected consumer: Consumer;
  protected queueName: string;
  protected consumerId: string;
  protected powerManager: PowerManager;
  protected config: IConfig;
  protected redisKeys: ReturnType<typeof redisKeys['getInstanceKeys']>;
  protected redisClientInstance: RedisClient | null = null;
  protected monitorThread: ChildProcess | null = null;
  protected ticker: Ticker | null = null;

  constructor(consumer: Consumer) {
    this.consumer = consumer;
    this.queueName = consumer.getQueueName();
    this.consumerId = consumer.getId();
    this.config = consumer.getConfig();
    this.powerManager = new PowerManager();
    this.redisKeys = consumer.getInstanceRedisKeys();
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

  protected nextTick(): void {
    if (!this.ticker) {
      this.ticker = new Ticker(() => {
        this.onTick();
      }, 1000);
      this.ticker.on(events.ERROR, (err: Error) =>
        this.consumer.emit(events.ERROR, err),
      );
    }
    this.ticker.nextTick();
  }

  protected onTick(): void {
    if (this.powerManager.isRunning()) {
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
      const { keyIndexHeartbeat, keyConsumerHeartbeat } = this.redisKeys;
      this.getRedisClientInstance((client) => {
        client.hset(
          keyIndexHeartbeat,
          keyConsumerHeartbeat,
          payload,
          (err?: Error | null) => {
            if (err) this.consumer.emit(events.ERROR, err);
            else this.nextTick();
          },
        );
      });
    }
    if (this.powerManager.isGoingDown()) {
      this.consumer.emit(events.HEARTBEAT_READY_TO_SHUTDOWN);
    }
  }

  protected getRedisClientInstance(cb: TUnaryFunction<RedisClient>): void {
    if (!this.redisClientInstance)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of RedisClient`),
      );
    else cb(this.redisClientInstance);
  }

  protected getTicker(cb: TUnaryFunction<Ticker>): void {
    if (!this.ticker)
      this.consumer.emit(
        events.ERROR,
        new Error(`Expected an instance of Ticker`),
      );
    else cb(this.ticker);
  }

  protected expireHeartbeat(client: RedisClient, cb: ICallback<void>): void {
    const { keyConsumerHeartbeat } = this.redisKeys;
    Heartbeat.handleExpiredHeartbeat(client, [keyConsumerHeartbeat], (err) =>
      cb(err),
    );
  }

  start(): void {
    this.powerManager.goingUp();
    RedisClient.getInstance(this.config, (client) => {
      this.redisClientInstance = client;
      this.startMonitor();
      this.nextTick();
      this.powerManager.commit();
      this.consumer.emit(events.HEARTBEAT_UP);
    });
  }

  stop(): void {
    this.powerManager.goingDown();
    this.consumer.once(events.HEARTBEAT_READY_TO_SHUTDOWN, () =>
      this.stopMonitor(() =>
        this.getRedisClientInstance((client) => {
          this.expireHeartbeat(client, () => {
            if (this.ticker) {
              this.ticker.quit();
              this.ticker = null;
            }
            client.end(true);
            this.redisClientInstance = null;
            this.powerManager.commit();
            this.consumer.emit(events.HEARTBEAT_DOWN);
          });
        }),
      ),
    );
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
      const { keyIndexHeartbeat } = redisKeys.getGlobalKeys();
      client.hdel(keyIndexHeartbeat, heartbeats, cb);
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
