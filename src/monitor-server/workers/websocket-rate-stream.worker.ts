import { ICallback, IConfig, TMessageQueue } from '../../../types';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { RedisClient } from '../../system/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Logger } from '../../system/common/logger';
import BLogger from 'bunyan';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import * as async from 'async';
import { events } from '../../system/common/events';
import { TimeSeries } from '../../system/common/time-series/time-series';
import { Heartbeat } from '../../system/common/heartbeat/heartbeat';
import {
  AcknowledgedRateTimeSeries,
  GlobalAcknowledgedRateTimeSeries,
  GlobalProcessingRateTimeSeries,
  GlobalUnacknowledgedRateTimeSeries,
  ProcessingRateTimeSeries,
  QueueAcknowledgedRateTimeSeries,
  QueueProcessingRateTimeSeries,
  QueueUnacknowledgedRateTimeSeries,
  UnacknowledgedRateTimeSeries,
} from '../../system/consumer/consumer-message-rate/consumer-message-rate-time-series';
import {
  GlobalPublishedRateTimeSeries,
  PublishedRateTimeSeries,
  QueuePublishedRateTimeSeries,
} from '../../system/producer/producer-message-rate/producer-message-rate-time-series';
import { InvalidCallbackReplyError } from '../../system/common/errors/invalid-callback-reply.error';

export class WebsocketRateStreamWorker {
  protected logger;
  protected lockManager: LockManager;
  protected ticker: Ticker;
  protected redisClient: RedisClient;
  protected queueData: {
    [ns: string]: {
      [queueName: string]: {
        consumers: string[];
        producers: string[];
      };
    };
  } = {};
  protected tasks: ((cb: ICallback<void>) => void)[] = [];
  protected noop = (): void => void 0;

  constructor(redisClient: RedisClient, logger: BLogger) {
    const { keyLockWebsocketRateStreamWorker } = redisKeys.getGlobalKeys();
    this.logger = logger;
    this.redisClient = redisClient;
    this.lockManager = new LockManager(
      redisClient,
      keyLockWebsocketRateStreamWorker,
      10000,
      false,
    );
    this.ticker = new Ticker(this.run, 1000);
    this.ticker.nextTick();
  }

  protected reset = (): void => {
    this.queueData = {};
    this.tasks = [];
  };

  protected addConsumerTasks = (
    ts: number,
    ns: string,
    queueName: string,
    consumerId: string,
  ): void => {
    this.tasks.push((cb: ICallback<void>) =>
      AcknowledgedRateTimeSeries(
        this.redisClient,
        consumerId,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) throw err;
        else {
          this.redisClient.publish(
            `streamConsumerAcknowledged:${consumerId}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
    this.tasks.push((cb: ICallback<void>) =>
      UnacknowledgedRateTimeSeries(
        this.redisClient,
        consumerId,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamConsumerUnacknowledged:${consumerId}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
    this.tasks.push((cb: ICallback<void>) =>
      ProcessingRateTimeSeries(
        this.redisClient,
        consumerId,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamConsumerProcessing:${consumerId}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
  };

  protected addQueueTasks = (
    ts: number,
    ns: string,
    queueName: string,
  ): void => {
    this.tasks.push((cb: ICallback<void>) =>
      QueueAcknowledgedRateTimeSeries(
        this.redisClient,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamQueueAcknowledged:${ns}:${queueName}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
    this.tasks.push((cb: ICallback<void>) =>
      QueueUnacknowledgedRateTimeSeries(
        this.redisClient,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamQueueUnacknowledged:${ns}:${queueName}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
    this.tasks.push((cb: ICallback<void>) =>
      QueueProcessingRateTimeSeries(
        this.redisClient,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamQueueProcessing:${ns}:${queueName}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
    this.tasks.push((cb: ICallback<void>) =>
      QueuePublishedRateTimeSeries(
        this.redisClient,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamQueuePublished:${ns}:${queueName}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
  };

  protected addProducerTasks = (
    ts: number,
    ns: string,
    queueName: string,
    producerId: string,
  ): void => {
    this.tasks.push((cb: ICallback<void>) =>
      PublishedRateTimeSeries(
        this.redisClient,
        producerId,
        String(queueName),
        String(ns),
        true,
      ).getRangeFrom(ts, (err, reply) => {
        if (err) cb(err);
        else {
          this.redisClient.publish(
            `streamProducerPublished:${producerId}`,
            JSON.stringify(reply),
            this.noop,
          );
          cb();
        }
      }),
    );
  };

  protected addGlobalTasks = (ts: number): void => {
    this.tasks.push((cb: ICallback<void>) =>
      GlobalAcknowledgedRateTimeSeries(this.redisClient, true).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalAcknowledged',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      GlobalUnacknowledgedRateTimeSeries(this.redisClient, true).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalUnacknowledged',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      GlobalProcessingRateTimeSeries(this.redisClient, true).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalProcessing',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      GlobalPublishedRateTimeSeries(this.redisClient, true).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalPublished',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
  };

  protected addQueue = (
    ns: string,
    queueName: string,
  ): { consumers: string[]; producers: string[] } => {
    if (!this.queueData[ns]) {
      this.queueData[ns] = {};
    }
    if (!this.queueData[ns][queueName]) {
      this.queueData[ns][queueName] = {
        consumers: [],
        producers: [],
      };
    }
    return this.queueData[ns][queueName];
  };

  protected handleQueueConsumers = (
    ts: number,
    ns: string,
    queueName: string,
    consumers: string[],
    cb: () => void,
  ): void => {
    async.each(
      consumers,
      (consumerId, done) => {
        this.addConsumerTasks(ts, ns, queueName, consumerId);
        done();
      },
      cb,
    );
  };

  protected handleQueueProducers = (
    ts: number,
    ns: string,
    queueName: string,
    producers: string[],
    cb: () => void,
  ): void => {
    async.each(
      producers,
      (producerId, done) => {
        this.addProducerTasks(ts, ns, queueName, producerId);
        done();
      },
      cb,
    );
  };

  protected handleQueue = (
    ts: number,
    ns: string,
    queueName: string,
    queue: { consumers: string[]; producers: string[] },
    cb: () => void,
  ): void => {
    const { consumers, producers } = queue;
    this.addQueueTasks(ts, ns, queueName);
    async.parallel(
      [
        (cb) => this.handleQueueConsumers(ts, ns, queueName, consumers, cb),
        (cb) => this.handleQueueProducers(ts, ns, queueName, producers, cb),
      ],
      cb,
    );
  };

  protected prepare = (cb: ICallback<void>): void => {
    const ts = TimeSeries.getCurrentTimestamp() - 10;
    this.addGlobalTasks(ts);
    async.eachOf(
      this.queueData,
      (queues, ns, done) => {
        async.eachOf(
          queues,
          (queue, queueName, done) => {
            this.handleQueue(ts, String(ns), String(queueName), queue, done);
          },
          done,
        );
      },
      cb,
    );
  };

  protected publish = (): void => {
    this.logger.debug(`Publishing...`);
    async.waterfall(this.tasks, this.noop);
  };

  protected getHeartbeatKeys = (cb: ICallback<void>): void => {
    Heartbeat.getValidHeartbeatKeys(this.redisClient, true, (err, reply) => {
      if (err) cb(err);
      else {
        async.each(
          reply ?? [],
          (item, done) => {
            if (typeof item === 'string') throw new InvalidCallbackReplyError();
            const { ns, queueName, consumerId, producerId } =
              redisKeys.extractData(item.keyHeartbeat) ?? {};
            if (ns && queueName && (consumerId || producerId)) {
              const queue = this.addQueue(ns, queueName);
              if (consumerId) queue.consumers.push(consumerId);
              else if (producerId) queue.producers.push(producerId);
            }
            done();
          },
          cb,
        );
      }
    });
  };

  protected getQueues = (cb: ICallback<void>): void => {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    this.redisClient.smembers(keyIndexQueue, (err, reply) => {
      if (err) cb(err);
      else {
        async.each(
          reply ?? [],
          (queue, done) => {
            const data: TMessageQueue = JSON.parse(queue);
            this.addQueue(data.ns, data.name);
            done();
          },
          cb,
        );
      }
    });
  };

  protected run = (): void => {
    this.logger.debug(`Acquiring lock...`);
    this.lockManager.acquireLock((err, lock) => {
      if (err) throw err;
      if (lock) {
        this.logger.debug(`Lock acquired.`);
        this.reset();
        async.waterfall(
          [this.getQueues, this.getHeartbeatKeys, this.prepare],
          (err?: Error | null) => {
            if (err) throw err;
            this.publish();
            this.ticker.nextTick();
          },
        );
      } else this.ticker.nextTick();
    });
  };

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}

process.on('message', (c: string) => {
  const config: IConfig = JSON.parse(c);
  if (config.namespace) {
    redisKeys.setNamespace(config.namespace);
  }
  RedisClient.getNewInstance(config, (err, client) => {
    if (err) throw err;
    else if (!client) throw new EmptyCallbackReplyError();
    else {
      const logger = Logger(WebsocketRateStreamWorker.name, config.log);
      new WebsocketRateStreamWorker(client, logger);
    }
  });
});
