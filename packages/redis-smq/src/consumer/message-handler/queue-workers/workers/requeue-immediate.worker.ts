/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import { ELuaScriptName } from '../../../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../common/redis/redis-keys/redis-keys.js';
import { _getMessages } from '../../../../message-manager/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../../message/index.js';
import { MessageEnvelope } from '../../../../message/message-envelope.js';
import { EQueueProperty, EQueueType } from '../../../../queue-manager/index.js';
import { withSharedPoolConnection } from '../../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { UnexpectedScriptReplyError } from '../../../../errors/index.js';
import { QueueWorkerAbstract } from '../queue-worker-abstract.js';

export class RequeueImmediateWorker extends QueueWorkerAbstract {
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
    withSharedPoolConnection((redisClient, cb) => {
      const { keyQueueRequeued } = redisKeys.getQueueKeys(
        this.queueParsedParams.queueParams.ns,
        this.queueParsedParams.queueParams.name,
        this.queueParsedParams.groupId,
      );
      // Fetch up to 100 messages at a time
      redisClient.lrange(keyQueueRequeued, 0, 99, (err, reply) => {
        if (err) cb(err);
        else cb(null, reply ?? []);
      });
    }, cb);
  };

  protected fetchMessages = (
    ids: string[],
    cb: ICallback<MessageEnvelope[]>,
  ): void => {
    if (!ids.length) {
      cb(null, []);
      return;
    }
    withSharedPoolConnection((redisClient, cb) => {
      _getMessages(redisClient, ids, cb);
    }, cb);
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

    const {
      keyQueueProperties,
      keyQueueDelayed,
      keyQueueRequeued,
      keyQueueDL,
      keyQueueConsumerGroups,
    } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams.ns,
      this.queueParsedParams.queueParams.name,
      this.queueParsedParams.groupId,
    );

    // Prepare static script arguments once.
    const keys: string[] = [
      keyQueueProperties,
      keyQueueRequeued,
      keyQueueDelayed,
      keyQueueDL,
      keyQueueConsumerGroups,
    ];

    const timestamp = Date.now();
    const argv: (string | number)[] = [
      EQueueProperty.QUEUE_TYPE,
      EQueueProperty.REQUEUED_MESSAGES_COUNT,
      EQueueProperty.DELAYED_MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
      EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PENDING,
      EMessagePropertyStatus.DEAD_LETTERED,
      EMessageProperty.DEAD_LETTERED_AT,
      EMessagePropertyStatus.UNACK_DELAYING,
      EMessageProperty.LAST_RETRIED_ATTEMPT_AT,
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,
      timestamp,
    ];

    // Prepare dynamic script arguments for each message.
    for (const msg of messages) {
      const messageId = msg.getId();
      const consumerGroupId = msg.getConsumerGroupId();
      const priority = msg.producibleMessage.getPriority();
      const retryDelay = msg.producibleMessage.getRetryDelay();
      const delayedTimestamp = retryDelay ? timestamp + retryDelay : 0;
      const destinationQueue = msg.getDestinationQueue();
      const { keyQueuePending, keyQueuePriorityPending } =
        redisKeys.getQueueKeys(
          destinationQueue.ns,
          destinationQueue.name,
          consumerGroupId,
        );
      const { keyMessage } = redisKeys.getMessageKeys(messageId);
      keys.push(keyMessage, keyQueuePending, keyQueuePriorityPending);
      argv.push(
        messageId,
        priority ?? '',
        retryDelay,
        delayedTimestamp,
        consumerGroupId ?? '',
      );
    }

    withSharedPoolConnection((redisClient, cb) => {
      this.logger.debug(
        `Executing REQUEUE_UNACKNOWLEDGED_MESSAGE script with ${messages.length} messages`,
      );
      redisClient.runScript(
        ELuaScriptName.REQUEUE_IMMEDIATE,
        keys,
        argv,
        (err, reply) => {
          if (err) {
            this.logger.error(
              'Error during message processing for requeue',
              err,
            );
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
          cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
        },
      );
    }, cb);
  };
}

export default RequeueImmediateWorker;
