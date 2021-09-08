import * as os from 'os';
import * as async from 'neo-async';
import { TCallback } from '../types';
import { PowerManager } from './power-manager';
import { Instance } from './instance';
import { Ticker } from './ticker';
import { ChildProcess, fork } from 'child_process';
import { resolve } from 'path';
import { events } from './events';
import { ConsumerRedisKeys } from './redis-keys/consumer-redis-keys';
import { merge } from 'lodash';
import { RedisClient } from './redis-client';

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

function handleConsumerData(hashKey: string, resources: Record<string, any>) {
  const extractedData = ConsumerRedisKeys.extractData(hashKey);
  if (!extractedData || !extractedData.consumerId) {
    throw new Error(`Invalid extracted consumer data`);
  }
  const { ns, queueName, consumerId } = extractedData;
  return {
    queues: {
      [ns]: {
        [queueName]: {
          consumers: {
            [consumerId]: {
              id: consumerId,
              namespace: ns,
              queueName: queueName,
              resources,
            },
          },
        },
      },
    },
  };
}

function getAllHeartBeats(
  client: RedisClient,
  cb: TCallback<Record<string, string>>,
) {
  const { keyIndexHeartBeat } = ConsumerRedisKeys.getGlobalKeys();
  client.hgetall(
    keyIndexHeartBeat,
    (err?: Error | null, result?: Record<string, string> | null) => {
      if (err) cb(err);
      else cb(null, result);
    },
  );
}

function getConsumerHeartBeat(
  client: RedisClient,
  id: string,
  queueName: string,
  cb: TCallback<string>,
) {
  const { keyConsumerHeartBeat, keyIndexHeartBeat } = new ConsumerRedisKeys(
    id,
    queueName,
  ).getKeys();
  client.hget(
    keyIndexHeartBeat,
    keyConsumerHeartBeat,
    (err?: Error | null, res?: string | null) => {
      if (err) cb(err);
      else cb(null, res);
    },
  );
}

export function HeartBeat(instance: Instance) {
  const powerManager = new PowerManager();
  const config = instance.getConfig();
  const instanceRedisKeys = instance.getInstanceRedisKeys();
  const { keyIndexHeartBeat, keyConsumerHeartBeat } = instanceRedisKeys;
  let redisClientInstance: RedisClient | null = null;
  let monitorThread: ChildProcess | null = null;
  let ticker: Ticker | null = null;

  function getRedisClientInstance() {
    if (!redisClientInstance) {
      throw new Error(`Expected an instance of RedisClient`);
    }
    return redisClientInstance;
  }

  function getTicker() {
    if (!ticker) {
      throw new Error(`Expected an instance of Ticker`);
    }
    return ticker;
  }

  function nextTick() {
    if (!ticker) {
      ticker = new Ticker(onTick, 1000);
    }
    ticker.nextTick();
  }

  function onTick() {
    if (powerManager.isRunning()) {
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
      getRedisClientInstance().hset(
        keyIndexHeartBeat,
        keyConsumerHeartBeat,
        payload,
        (err?: Error | null) => {
          if (err) instance.error(err);
          else nextTick();
        },
      );
    }
    if (powerManager.isGoingDown()) {
      instance.emit(events.HEARTBEAT_READY_TO_SHUTDOWN);
    }
  }

  function startMonitor() {
    monitorThread = fork(resolve(`${__dirname}/heartbeat-monitor.js`));
    monitorThread.on('error', (err) => {
      instance.error(err);
    });
    monitorThread.on('exit', (code, signal) => {
      const err = new Error(
        `statsAggregatorThread exited with code ${code} and signal ${signal}`,
      );
      instance.error(err);
    });
    monitorThread.send(JSON.stringify(config));
  }

  function stopMonitor() {
    if (monitorThread) {
      monitorThread.kill('SIGHUP');
      monitorThread = null;
    }
  }

  return {
    start() {
      powerManager.goingUp();
      RedisClient.getInstance(config, (c) => {
        redisClientInstance = c;
        startMonitor();
        nextTick();
        instance.emit(events.HEARTBEAT_UP);
        powerManager.commit();
      });
    },

    stop() {
      powerManager.goingDown();
      instance.once(events.HEARTBEAT_READY_TO_SHUTDOWN, () => {
        stopMonitor();
        getTicker().shutdown(() => {
          getRedisClientInstance().hdel(
            keyIndexHeartBeat,
            keyConsumerHeartBeat,
            (err?: Error | null) => {
              if (err) instance.error(err);
              else {
                getRedisClientInstance().end(true);
                redisClientInstance = null;
                powerManager.commit();
                instance.emit(events.HEARTBEAT_DOWN);
              }
            },
          );
        });
      });
    },
  };
}

HeartBeat.getConsumersByOnlineStatus = (
  client: RedisClient,
  cb: TCallback<{ onlineConsumers: string[]; offlineConsumers: string[] }>,
) => {
  getAllHeartBeats(client, (err, data) => {
    if (err) cb(err);
    else {
      const onlineConsumers: string[] = [];
      const offlineConsumers: string[] = [];
      if (data) {
        async.each(
          data,
          (value: string, key: string | number, done: TCallback<void>) => {
            const { timestamp }: { timestamp: number } = JSON.parse(value);
            const r = validateOnlineTimestamp(timestamp);
            if (r) onlineConsumers.push(String(key));
            else offlineConsumers.push(String(key));
            done();
          },
          () => {
            cb(null, {
              onlineConsumers,
              offlineConsumers,
            });
          },
        );
      } else
        cb(null, {
          onlineConsumers,
          offlineConsumers,
        });
    }
  });
};

HeartBeat.isOnline = function isOnline(
  {
    client,
    queueName,
    id,
  }: {
    client: RedisClient;
    queueName: string;
    id: string;
  },
  cb: TCallback<boolean>,
) {
  getConsumerHeartBeat(
    client,
    id,
    queueName,
    (err?: Error | null, res?: string | null) => {
      if (err) cb(err);
      else {
        let online = false;
        if (res) {
          const { timestamp }: { timestamp: number } = JSON.parse(res);
          online = validateOnlineTimestamp(timestamp);
        }
        cb(null, online);
      }
    },
  );
};

HeartBeat.handleOfflineConsumers = (
  client: RedisClient,
  offlineConsumers: string[],
  cb: TCallback<number>,
) => {
  if (offlineConsumers.length) {
    const { keyIndexHeartBeat } = ConsumerRedisKeys.getGlobalKeys();
    client.hdel(keyIndexHeartBeat, offlineConsumers, cb);
  } else cb();
};

HeartBeat.getOnlineConsumers = (
  client: RedisClient,
  cb: TCallback<Record<string, any>>,
) => {
  getAllHeartBeats(client, (err, data) => {
    if (err) cb(err);
    else {
      const onlineConsumers = {};
      if (data) {
        async.each(
          data,
          (value: string, key: string | number, done: TCallback<void>) => {
            const { usage: resources }: { usage: Record<string, any> } =
              JSON.parse(value);
            const r = handleConsumerData(`${key}`, resources);
            merge(onlineConsumers, r);
            done();
          },
          () => {
            cb(null, onlineConsumers);
          },
        );
      } else cb(null, onlineConsumers);
    }
  });
};
