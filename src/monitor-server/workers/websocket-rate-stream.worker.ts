import { ICallback, IConfig, TQueueParams } from '../../../types';
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
  AcknowledgedTimeSeries,
  DeadLetteredTimeSeries,
  GlobalAcknowledgedTimeSeries,
  GlobalDeadLetteredTimeSeries,
  QueueAcknowledgedTimeSeries,
  QueueDeadLetteredTimeSeries,
} from '../../system/consumer/consumer-time-series';
import {
  GlobalPublishedTimeSeries,
  PublishedTimeSeries,
  QueuePublishedTimeSeries,
} from '../../system/producer/producer-time-series';
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
    queue: TQueueParams,
    consumerId: string,
  ): void => {
    this.tasks.push((cb: ICallback<void>) =>
      AcknowledgedTimeSeries(this.redisClient, consumerId, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) throw err;
          else {
            this.redisClient.publish(
              `streamConsumerAcknowledged:${consumerId}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      DeadLetteredTimeSeries(this.redisClient, consumerId, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamConsumerDeadLettered:${consumerId}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
  };

  protected addQueueTasks = (ts: number, queue: TQueueParams): void => {
    this.tasks.push((cb: ICallback<void>) =>
      QueueAcknowledgedTimeSeries(this.redisClient, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamQueueAcknowledged:${queue.ns}:${queue.name}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      QueueDeadLetteredTimeSeries(this.redisClient, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamQueueDeadLettered:${queue.ns}:${queue.name}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      QueuePublishedTimeSeries(this.redisClient, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamQueuePublished:${queue.ns}:${queue.name}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
  };

  protected addProducerTasks = (
    ts: number,
    queue: TQueueParams,
    producerId: string,
  ): void => {
    this.tasks.push((cb: ICallback<void>) =>
      PublishedTimeSeries(this.redisClient, producerId, queue).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              `streamProducerPublished:${producerId}`,
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
  };

  protected addGlobalTasks = (ts: number): void => {
    this.tasks.push((cb: ICallback<void>) =>
      GlobalAcknowledgedTimeSeries(this.redisClient).getRangeFrom(
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
      GlobalDeadLetteredTimeSeries(this.redisClient).getRangeFrom(
        ts,
        (err, reply) => {
          if (err) cb(err);
          else {
            this.redisClient.publish(
              'streamGlobalDeadLettered',
              JSON.stringify(reply),
              this.noop,
            );
            cb();
          }
        },
      ),
    );
    this.tasks.push((cb: ICallback<void>) =>
      GlobalPublishedTimeSeries(this.redisClient).getRangeFrom(
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
    queue: TQueueParams,
  ): { consumers: string[]; producers: string[] } => {
    const { ns, name } = queue;
    if (!this.queueData[ns]) {
      this.queueData[ns] = {};
    }
    if (!this.queueData[ns][name]) {
      this.queueData[ns][name] = {
        consumers: [],
        producers: [],
      };
    }
    return this.queueData[ns][name];
  };

  protected handleQueueConsumers = (
    ts: number,
    queue: TQueueParams,
    consumers: string[],
    cb: () => void,
  ): void => {
    async.each(
      consumers,
      (consumerId, done) => {
        this.addConsumerTasks(ts, queue, consumerId);
        done();
      },
      cb,
    );
  };

  protected handleQueueProducers = (
    ts: number,
    queue: TQueueParams,
    producers: string[],
    cb: () => void,
  ): void => {
    async.each(
      producers,
      (producerId, done) => {
        this.addProducerTasks(ts, queue, producerId);
        done();
      },
      cb,
    );
  };

  protected handleQueue = (
    ts: number,
    queue: TQueueParams,
    queueProperties: { consumers: string[]; producers: string[] },
    cb: () => void,
  ): void => {
    const { consumers, producers } = queueProperties;
    this.addQueueTasks(ts, queue);
    async.parallel(
      [
        (cb) => this.handleQueueConsumers(ts, queue, consumers, cb),
        (cb) => this.handleQueueProducers(ts, queue, producers, cb),
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
            this.handleQueue(
              ts,
              { ns: String(ns), name: String(queueName) },
              queue,
              done,
            );
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
              const queue = this.addQueue({ ns, name: queueName });
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
          (queueStr, done) => {
            const queue: TQueueParams = JSON.parse(queueStr);
            this.addQueue(queue);
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
