/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as os from 'os';
import {
  EQueueType,
  IQueueParams,
  IQueueRateLimit,
  TQueueConsumer,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  RedisClient,
  Ticker,
} from 'redis-smq-common';
import { events } from '../../../common/events/events';
import { MessageHandler } from './message-handler';
import { QueueRateLimit } from '../../queue/queue-rate-limit';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { QueueNotFoundError } from '../../queue/errors';
import { _getQueueProperties } from '../../queue/queue/_get-queue-properties';

const IPAddresses = (() => {
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
})();

export class DequeueMessage {
  protected redisClient: RedisClient;
  protected queue: IQueueParams;
  protected consumerId: string;
  protected redisKeys: ReturnType<(typeof redisKeys)['getQueueConsumerKeys']>;
  protected queueRateLimit: IQueueRateLimit | null = null;
  protected ticker: Ticker;
  protected messageHandler: MessageHandler;
  protected blockUntilMessageReceived: boolean;
  protected queueType: EQueueType | null = null;

  constructor(
    messageHandler: MessageHandler,
    redisClient: RedisClient,
    blockUntilMessageReceived = true,
  ) {
    this.messageHandler = messageHandler;
    this.redisClient = redisClient;
    this.blockUntilMessageReceived = blockUntilMessageReceived;
    this.queue = messageHandler.getQueue();
    this.consumerId = messageHandler.getConsumerId();
    this.redisKeys = redisKeys.getQueueConsumerKeys(
      this.queue,
      this.consumerId,
    );
    this.ticker = new Ticker(() => {
      this.messageHandler.emit(events.MESSAGE_NEXT);
    });
  }

  protected handleMessage: ICallback<string | null> = (err, messageId) => {
    if (err) {
      this.ticker.abort();
      this.messageHandler.handleError(err);
    } else if (typeof messageId === 'string') {
      this.messageHandler.emit(
        events.MESSAGE_RECEIVED,
        messageId,
        this.queue,
        this.consumerId,
      );
    } else {
      this.ticker.nextTick();
    }
  };

  protected dequeueWithRateLimit = (): boolean => {
    if (this.queueRateLimit) {
      QueueRateLimit.hasExceeded(
        this.redisClient,
        this.queue,
        this.queueRateLimit,
        (err, isExceeded) => {
          if (err) this.messageHandler.handleError(err);
          else if (isExceeded) this.ticker.nextTick();
          else this.dequeueWithRateLimitExec();
        },
      );
      return true;
    }
    return false;
  };

  protected dequeueWithRateLimitExec = () => {
    if (this.isPriorityQueuingEnabled()) this.dequeueWithPriority();
    else this.dequeueAndReturn();
  };

  protected dequeueWithPriority = (): boolean => {
    if (this.isPriorityQueuingEnabled()) {
      this.redisClient.zpoprpush(
        this.redisKeys.keyPriorityQueuePending,
        this.redisKeys.keyQueueProcessing,
        this.handleMessage,
      );
      return true;
    }
    return false;
  };

  protected dequeueAndBlock = (): boolean => {
    if (this.blockUntilMessageReceived) {
      this.redisClient.brpoplpush(
        this.redisKeys.keyQueuePending,
        this.redisKeys.keyQueueProcessing,
        0,
        this.handleMessage,
      );
      return true;
    }
    return false;
  };

  protected dequeueAndReturn = (): void => {
    this.redisClient.rpoplpush(
      this.redisKeys.keyQueuePending,
      this.redisKeys.keyQueueProcessing,
      this.handleMessage,
    );
  };

  dequeue(): void {
    this.dequeueWithRateLimit() ||
      this.dequeueWithPriority() ||
      this.dequeueAndBlock() ||
      this.dequeueAndReturn();
  }

  protected isPriorityQueuingEnabled(): boolean {
    return this.queueType === EQueueType.PRIORITY_QUEUE;
  }

  run(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          const {
            keyQueues,
            keyQueueConsumers,
            keyConsumerQueues,
            keyQueueProcessing,
            keyProcessingQueues,
            keyQueueProcessingQueues,
          } = this.redisKeys;
          const consumerInfo: TQueueConsumer = {
            ipAddress: IPAddresses,
            hostname: os.hostname(),
            pid: process.pid,
            createdAt: Date.now(),
          };
          this.redisClient.runScript(
            ELuaScriptName.INIT_CONSUMER_QUEUE,
            [
              keyQueues,
              keyQueueConsumers,
              keyConsumerQueues,
              keyProcessingQueues,
              keyQueueProcessingQueues,
            ],
            [
              this.consumerId,
              JSON.stringify(consumerInfo),
              JSON.stringify(this.queue),
              keyQueueProcessing,
            ],
            (err, reply) => {
              if (err) cb(err);
              else if (!reply) cb(new QueueNotFoundError());
              else cb();
            },
          );
        },
        (cb: ICallback<void>) => {
          _getQueueProperties(this.redisClient, this.queue, (err, reply) => {
            if (err) cb(err);
            else if (!reply) cb(new CallbackEmptyReplyError());
            else {
              this.queueType = reply.queueType;
              this.queueRateLimit = reply.rateLimit ?? null;
              cb();
            }
          });
        },
      ],
      cb,
    );
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, cb);
    this.ticker.quit();
  }
}
