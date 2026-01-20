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

export class RequeueDelayedWorker extends QueueWorkerAbstract {
  work = (cb: ICallback): void => {
    this.logger?.debug(
      'Starting requeue unacknowledged messages with delay cycle.',
    );
    this.logger?.debug(
      `Queue: ${this.queueParsedParams.queueParams.ns}:${this.queueParsedParams.queueParams.name}, GroupId: ${this.queueParsedParams.groupId || 'none'}`,
    );

    async.waterfall(
      [this.fetchMessageIds, this.fetchMessages, this.enqueueMessages],
      (err) => {
        if (err) {
          this.logger?.error('Error in work cycle.', err);
        } else {
          this.logger?.debug('Completed work cycle.');
        }
        cb(err);
      },
    );
  };

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    this.logger?.debug('Fetching delayed message IDs.');

    withSharedPoolConnection((redisClient, cb) => {
      const { keyQueueDelayed } = redisKeys.getQueueKeys(
        this.queueParsedParams.queueParams.ns,
        this.queueParsedParams.queueParams.name,
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
    }, cb);
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

    withSharedPoolConnection((redisClient, cb) => {
      _getMessages(redisClient, ids, (err, messages) => {
        if (err) {
          this.logger.error('Error fetching messages.', err);
          return cb(err);
        }
        const messageCount = messages?.length || 0;
        this.logger.debug(`Successfully retrieved ${messageCount} messages.`);
        cb(null, messages || []);
      });
    }, cb);
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

    withSharedPoolConnection((redisClient, cb) => {
      const {
        keyQueueProperties,
        keyQueueDelayed,
        keyQueueDL,
        keyQueueConsumerGroups,
      } = redisKeys.getQueueKeys(
        this.queueParsedParams.queueParams.ns,
        this.queueParsedParams.queueParams.name,
        this.queueParsedParams.groupId,
      );

      // Static keys that are the same for all messages in the batch
      const keys: string[] = [
        keyQueueProperties,
        keyQueueDelayed,
        keyQueueDL,
        keyQueueConsumerGroups,
      ];
      const argv: (string | number)[] = [
        // Queue Property Constants
        EQueueProperty.QUEUE_TYPE,
        EQueueProperty.DELAYED_MESSAGES_COUNT,
        EQueueProperty.PENDING_MESSAGES_COUNT,
        EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
        EMessageProperty.STATUS,
        EMessagePropertyStatus.PENDING,
        EMessagePropertyStatus.DEAD_LETTERED,
        EMessageProperty.DEAD_LETTERED_AT,
        EMessageProperty.LAST_RETRIED_ATTEMPT_AT,
        EQueueType.LIFO_QUEUE,
        EQueueType.FIFO_QUEUE,
        Date.now(),
      ];

      for (const msg of messages) {
        const messageId = msg.getId();
        const consumerGroupId = msg.getConsumerGroupId();
        const { keyMessage } = redisKeys.getMessageKeys(messageId);
        const destinationQueue = msg.getDestinationQueue();
        const { keyQueuePending, keyQueuePriorityPending } =
          redisKeys.getQueueKeys(
            destinationQueue.ns,
            destinationQueue.name,
            msg.getConsumerGroupId(),
          );
        keys.push(keyMessage, keyQueuePending, keyQueuePriorityPending);
        argv.push(
          messageId,
          msg.producibleMessage.getPriority() ?? '',
          consumerGroupId ?? '',
        );
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
            this.logger.info(
              `Successfully requeued ${reply} delayed messages.`,
            );
            return cb();
          }
          this.logger.error(
            `Script execution returned unexpected response: ${reply}`,
          );
          cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
        },
      );
    }, cb);
  };
}

export default RequeueDelayedWorker;
