/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, PanicError } from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { _getMessages } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import { IConsumerMessageHandlerWorkerPayload } from '../types/index.js';
import { Worker } from './worker.js';

class RequeueImmediateWorker extends Worker {
  work = (cb: ICallback): void => {
    this.logger.debug('Starting requeue unacknowledged messages work cycle');

    this.logger.debug(
      `Queue: ${this.queueParsedParams.queueParams.ns}:${this.queueParsedParams.queueParams.name}, GroupId: ${this.queueParsedParams.groupId || 'none'}`,
    );

    async.waterfall(
      [this.fetchMessageIds, this.fetchMessages, this.requeueMessages],
      (err) => {
        if (err) {
          this.logger.error(
            'A fatal error occurred during requeue unacknowledged messages worker cycle.',
            err,
          );
        }
        cb(err);
      },
    );
  };

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return;
    }
    const { keyQueueRequeued } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );
    // Fetch up to 100 messages at a time
    redisClient.lrange(keyQueueRequeued, 0, 99, (err, reply) => {
      if (err) cb(err);
      else cb(null, reply ?? []);
    });
  };

  protected fetchMessages = (
    ids: string[],
    cb: ICallback<MessageEnvelope[]>,
  ): void => {
    if (!ids.length) {
      cb(null, []);
      return;
    }
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return;
    }
    _getMessages(redisClient, ids, cb);
  };

  protected requeueMessages = (
    messages: MessageEnvelope[],
    cb: ICallback,
  ): void => {
    if (!messages.length) {
      this.logger.debug('No messages to requeue, work cycle complete');
      cb();
      return;
    }

    const { keyQueueProperties, keyQueueDelayed, keyQueueRequeued } =
      redisKeys.getQueueKeys(
        this.queueParsedParams.queueParams,
        this.queueParsedParams.groupId,
      );

    // Prepare static script arguments once.
    const keys: string[] = [
      keyQueueProperties,
      keyQueueRequeued,
      keyQueueDelayed,
    ];

    const timestamp = Date.now();
    const argv: (string | number)[] = [
      EQueueProperty.QUEUE_TYPE,
      EQueueProperty.REQUEUED_MESSAGES_COUNT,
      EQueueProperty.DELAYED_MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PENDING,
      EMessagePropertyStatus.UNACK_DELAYING,
      EMessageProperty.LAST_RETRIED_ATTEMPT_AT,
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,
      timestamp,
    ];

    // Prepare dynamic script arguments for each message.
    for (const msg of messages) {
      const messageId = msg.getId();
      const priority = msg.producibleMessage.getPriority();
      const retryDelay = msg.producibleMessage.getRetryDelay();
      const delayedTimestamp = retryDelay ? timestamp + retryDelay : 0;
      const { keyQueuePending, keyQueuePriorityPending } =
        redisKeys.getQueueKeys(
          msg.getDestinationQueue(),
          msg.getConsumerGroupId(),
        );
      const { keyMessage } = redisKeys.getMessageKeys(messageId);
      keys.push(keyMessage, keyQueuePending, keyQueuePriorityPending);
      argv.push(messageId, priority ?? '', retryDelay, delayedTimestamp);
    }

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return;
    }

    this.logger.debug(
      `Executing REQUEUE_UNACKNOWLEDGED_MESSAGE script with ${messages.length} messages`,
    );
    redisClient.runScript(
      ELuaScriptName.REQUEUE_IMMEDIATE,
      keys,
      argv,
      (err, reply) => {
        if (err) {
          this.logger.error('Error during message processing for requeue', err);
          return cb(err);
        }
        if (typeof reply === 'number') {
          if (reply !== messages.length) {
            this.logger.warn(
              `Script reported processing ${reply} messages, but expected ${messages.length}. This may be due to a message being moved or deleted before the worker could process it.`,
            );
          }
          this.logger.info(`Successfully requeued ${reply} messages.`);
          return cb();
        }
        // Catch script-level errors and report them.
        cb(
          new PanicError(`Expected a numeric reply, but got ${String(reply)}`),
        );
      },
    );
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new RequeueImmediateWorker(payload);
