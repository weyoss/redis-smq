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

class RequeueDelayedWorker extends Worker {
  work = (cb: ICallback): void => {
    this.logger.debug(
      'Starting requeue unacknowledged messages with delay cycle.',
    );
    this.logger.debug(
      `Queue: ${this.queueParsedParams.queueParams.ns}:${this.queueParsedParams.queueParams.name}, GroupId: ${this.queueParsedParams.groupId || 'none'}`,
    );

    async.waterfall(
      [this.fetchMessageIds, this.fetchMessages, this.enqueueMessages],
      (err) => {
        if (err) {
          this.logger.error('Error in work cycle.', err);
        } else {
          this.logger.debug('Completed work cycle.');
        }
        cb(err);
      },
    );
  };

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    this.logger.debug('Fetching delayed message IDs.');

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance.', redisClient);
      cb(redisClient);
      return;
    }

    const { keyQueueDelayed } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );

    this.logger.debug(`Using delayed queue key: ${keyQueueDelayed}`);
    const currentTimestamp = Date.now();

    redisClient.zrangebyscore(
      keyQueueDelayed,
      0,
      currentTimestamp,
      0,
      99,
      (err, ids) => {
        if (err) {
          this.logger.error('Error fetching delayed message IDs.', err);
          return cb(err);
        }
        const messageCount = ids?.length || 0;
        this.logger.debug(
          `Found ${messageCount} delayed messages ready for requeue (current timestamp: ${currentTimestamp}).`,
        );
        cb(null, ids || []);
      },
    );
  };

  protected fetchMessages = (
    ids: string[],
    cb: ICallback<MessageEnvelope[]>,
  ): void => {
    if (!ids.length) {
      this.logger.debug('No message IDs to fetch, skipping message retrieval.');
      return cb(null, []);
    }

    this.logger.debug(`Fetching ${ids.length} messages from storage.`);

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance.', redisClient);
      cb(redisClient);
      return;
    }

    _getMessages(redisClient, ids, (err, messages) => {
      if (err) {
        this.logger.error('Error fetching messages.', err);
        return cb(err);
      }
      const messageCount = messages?.length || 0;
      this.logger.debug(`Successfully retrieved ${messageCount} messages.`);
      cb(null, messages || []);
    });
  };

  protected enqueueMessages = (
    messages: MessageEnvelope[],
    cb: ICallback,
  ): void => {
    if (!messages.length) {
      this.logger.debug('No messages to enqueue, work cycle complete.');
      return cb();
    }

    this.logger.debug(`Preparing to enqueue ${messages.length} messages.`);

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance.', redisClient);
      return cb(redisClient);
    }

    const { keyQueueProperties, keyQueueDelayed } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );

    // Static keys that are the same for all messages in the batch
    const keys: string[] = [keyQueueProperties, keyQueueDelayed];
    const argv: (string | number)[] = [
      // Queue Property Constants
      EQueueProperty.QUEUE_TYPE,
      EQueueProperty.DELAYED_MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PENDING,
      EMessageProperty.LAST_RETRIED_ATTEMPT_AT,
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,
      Date.now(),
    ];

    for (const msg of messages) {
      const messageId = msg.getId();
      const { keyMessage } = redisKeys.getMessageKeys(messageId);
      const { keyQueuePending, keyQueuePriorityPending } =
        redisKeys.getQueueKeys(
          msg.getDestinationQueue(),
          msg.getConsumerGroupId(),
        );
      keys.push(keyMessage, keyQueuePending, keyQueuePriorityPending);
      argv.push(messageId, msg.producibleMessage.getPriority() ?? '');
    }

    this.logger.debug(
      `Executing REQUEUE_UNACKNOWLEDGED_MESSAGE_WITH_DELAY script for ${messages.length} messages.`,
    );
    redisClient.runScript(
      ELuaScriptName.REQUEUE_DELAYED,
      keys,
      argv,
      (err, reply) => {
        if (err) {
          this.logger.error(
            'Error executing REQUEUE_UNACKNOWLEDGED_MESSAGE_WITH_DELAY script.',
            err,
          );
          return cb(err);
        }
        if (typeof reply === 'number') {
          if (reply !== messages.length) {
            this.logger.warn(
              `Script reported processing ${reply} messages, but expected ${messages.length}.`,
            );
          }
          this.logger.info(`Successfully requeued ${reply} delayed messages.`);
          return cb();
        }
        this.logger.error(
          `Script execution returned unexpected response: ${reply}`,
        );
        cb(new PanicError(`Unexpected reply: ${reply}`));
      },
    );
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new RequeueDelayedWorker(payload);
