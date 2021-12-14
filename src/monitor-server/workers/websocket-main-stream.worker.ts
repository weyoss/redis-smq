import {
  IConfig,
  ICallback,
  TMessageQueue,
  TWebsocketMainStreamPayload,
  TWebsocketMainStreamPayloadQueue,
} from '../../../types';
import * as async from 'async';
import { redisKeys } from '../../system/common/redis-keys/redis-keys';
import { LockManager } from '../../system/common/lock-manager/lock-manager';
import { RedisClient } from '../../system/redis-client/redis-client';
import { Logger } from '../../system/common/logger';
import { QueueManager } from '../../system/queue-manager/queue-manager';
import { Ticker } from '../../system/common/ticker/ticker';
import { events } from '../../system/common/events';
import BLogger from 'bunyan';
import { MessageManager } from '../../system/message-manager/message-manager';
import { EmptyCallbackReplyError } from '../../system/common/errors/empty-callback-reply.error';
import { Heartbeat } from '../../system/common/heartbeat';

export class WebsocketMainStreamWorker {
  protected logger;
  protected lockManager: LockManager;
  protected redisClient: RedisClient;
  protected queueManager: QueueManager;
  protected messageManager: MessageManager;
  protected ticker: Ticker;
  protected noop = (): void => void 0;
  protected data: TWebsocketMainStreamPayload = {
    scheduledMessages: 0,
    queues: {},
  };

  constructor(
    queueManager: QueueManager,
    messageManager: MessageManager,
    redisClient: RedisClient,
    logger: BLogger,
  ) {
    const { keyLockWorkerStats } = redisKeys.getGlobalKeys();
    this.logger = logger;
    this.lockManager = new LockManager(
      redisClient,
      keyLockWorkerStats,
      10000,
      true,
    );
    this.redisClient = redisClient;
    this.queueManager = queueManager;
    this.messageManager = messageManager;
    this.ticker = new Ticker(this.run, 1000);
    this.ticker.nextTick();
  }

  protected addQueue = (
    ns: string,
    queueName: string,
  ): TWebsocketMainStreamPayloadQueue => {
    if (!this.data.queues[ns]) {
      this.data.queues[ns] = {};
    }
    if (!this.data.queues[ns][queueName]) {
      this.data.queues[ns][queueName] = {
        queueName,
        namespace: ns,
        deadLetteredMessages: 0,
        acknowledgedMessages: 0,
        pendingMessages: 0,
        pendingMessagesWithPriority: 0,
        consumers: 0,
        producers: 0,
      };
    }
    return this.data.queues[ns][queueName];
  };

  protected getQueueSize = (
    queues: TMessageQueue[],
    cb: ICallback<void>,
  ): void => {
    if (queues && queues.length) {
      let keys: string[] = [];
      const multi = this.redisClient.multi();
      const handleResult = (res: number[]) => {
        const instanceTypes = redisKeys.getTypes();
        async.eachOf(
          res,
          (size, index, done) => {
            const extractedData = redisKeys.extractData(keys[+index]);
            if (extractedData) {
              const { ns, queueName, type } = extractedData;
              const queue = this.addQueue(ns, queueName);
              if (type === instanceTypes.KEY_QUEUE_DL) {
                queue.deadLetteredMessages = size;
              } else if (type === instanceTypes.KEY_QUEUE) {
                queue.pendingMessages = size;
              } else if (type === instanceTypes.KEY_QUEUE_PRIORITY) {
                queue.pendingMessagesWithPriority = size;
              } else {
                queue.acknowledgedMessages = size;
              }
            }
            done();
          },
          cb,
        );
      };
      async.each(
        queues,
        (queue, done) => {
          const {
            keyQueue,
            keyQueuePriority,
            keyQueueDL,
            keyQueueAcknowledgedMessages,
          } = redisKeys.getKeys(queue.name, queue.ns);
          multi.llen(keyQueue);
          multi.zcard(keyQueuePriority);
          multi.llen(keyQueueDL);
          multi.llen(keyQueueAcknowledgedMessages);
          keys = keys.concat([
            keyQueue,
            keyQueuePriority,
            keyQueueDL,
            keyQueueAcknowledgedMessages,
          ]);
          done();
        },
        () => {
          this.redisClient.execMulti<number>(multi, (err, res) => {
            if (err) cb(err);
            else handleResult(res ?? []);
          });
        },
      );
    } else cb();
  };

  protected getQueues = (cb: ICallback<TMessageQueue[]>): void => {
    this.queueManager.getMessageQueues(cb);
  };

  protected getScheduledMessages = (cb: ICallback<void>): void => {
    this.messageManager.getScheduledMessagesCount((err, count) => {
      if (err) cb(err);
      else {
        this.data.scheduledMessages = count ?? 0;
        cb();
      }
    });
  };

  protected processHeartbeats = (cb: ICallback<void>): void => {
    Heartbeat.getValidHeartbeatKeys(this.redisClient, (err, reply) => {
      if (err) cb(err);
      else {
        async.each(
          reply ?? [],
          (key, done) => {
            const { ns, queueName, consumerId, producerId } =
              redisKeys.extractData(key) ?? {};
            if (ns && queueName && (consumerId || producerId)) {
              const queue = this.addQueue(ns, queueName);
              if (consumerId) queue.consumers += 1;
              else queue.producers += 1;
              done();
            } else done();
          },
          cb,
        );
      }
    });
  };

  protected publish = (cb: ICallback<number>): void => {
    this.logger.debug(`Publishing...`);
    this.redisClient.publish('mainStream', JSON.stringify(this.data), cb);
  };

  protected reset = (cb: ICallback<void>): void => {
    this.data = {
      scheduledMessages: 0,
      queues: {},
    };
    cb();
  };

  protected run = (): void => {
    this.logger.debug(`Acquiring lock...`);
    this.lockManager.acquireLock((err) => {
      if (err) throw err;
      this.logger.debug(`Lock acquired.`);
      async.waterfall(
        [
          this.reset,
          this.getScheduledMessages,
          this.getQueues,
          this.getQueueSize,
          this.processHeartbeats,
          this.publish,
        ],
        (err?: Error | null) => {
          if (err) throw err;
          this.ticker.nextTick();
        },
      );
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
      const logger = Logger(WebsocketMainStreamWorker.name, config.log);
      const queueManager = new QueueManager(client, logger);
      const messageManager = new MessageManager(client, logger);
      new WebsocketMainStreamWorker(
        queueManager,
        messageManager,
        client,
        logger,
      );
    }
  });
});
