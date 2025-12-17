/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, PanicError } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { _fromMessage } from '../../../message-manager/_/_from-message.js';
import { _getMessages } from '../../../message-manager/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../message/index.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { EQueueProperty, EQueueType } from '../../../queue-manager/index.js';
import { WorkerAbstract } from './worker-abstract.js';
import { workerBootstrap } from './worker-bootstrap.js';
import { withSharedPoolConnection } from '../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';

export class PublishScheduledWorker extends WorkerAbstract {
  work = (cb: ICallback): void => {
    this.logger.debug('Starting publish scheduled messages work cycle');
    this.logger.debug(
      `Queue: ${this.queueParsedParams.queueParams.ns}:${this.queueParsedParams.queueParams.name}, GroupId: ${this.queueParsedParams.groupId || 'none'}`,
    );

    async.waterfall(
      [this.fetchMessageIds, this.fetchMessages, this.enqueueMessages],
      (err) => {
        if (err) {
          this.logger.error(
            'Error in publish scheduled messages workflow',
            err,
          );
        } else {
          this.logger.debug('Completed publish scheduled messages work cycle');
        }
        cb(err);
      },
    );
  };

  protected fetchMessageIds = (cb: ICallback<string[]>): void => {
    this.logger.debug('Fetching scheduled message IDs');

    withSharedPoolConnection((redisClient, cb) => {
      const { keyQueueScheduled } = redisKeys.getQueueKeys(
        this.queueParsedParams.queueParams.ns,
        this.queueParsedParams.queueParams.name,
        this.queueParsedParams.groupId,
      );

      this.logger.debug(`Using scheduled queue key: ${keyQueueScheduled}`);
      const currentTimestamp = Date.now();

      redisClient.zrangebyscore(
        keyQueueScheduled,
        0,
        currentTimestamp,
        0,
        99,
        (err, ids) => {
          if (err) {
            this.logger.error('Error fetching scheduled message IDs', err);
            return cb(err);
          }
          const messageCount = ids?.length || 0;
          this.logger.debug(
            `Found ${messageCount} scheduled messages ready for publishing (current timestamp: ${currentTimestamp})`,
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
      this.logger.debug('No message IDs to fetch, skipping message retrieval');
      cb(null, []);
      return;
    }

    this.logger.debug(`Fetching ${ids.length} messages from storage`);

    withSharedPoolConnection((redisClient, cb) => {
      _getMessages(redisClient, ids, (err, messages) => {
        if (err) {
          this.logger.error('Error fetching messages', err);
          cb(err);
        } else {
          const messageCount = messages?.length || 0;
          this.logger.debug(`Successfully retrieved ${messageCount} messages`);
          cb(null, messages || []);
        }
      });
    }, cb);
  };

  protected enqueueMessages = (
    messages: MessageEnvelope[],
    cb: ICallback,
  ): void => {
    if (!messages.length) {
      this.logger.debug('No messages to enqueue, work cycle complete');
      cb();
      return;
    }

    this.logger.debug(`Preparing to enqueue ${messages.length} messages`);

    withSharedPoolConnection((redisClient, cb) => {
      const {
        keyQueueProperties,
        keyQueuePending,
        keyQueuePriorityPending,
        keyQueueScheduled,
        keyQueueMessages,
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
        keyQueuePending,
        keyQueueMessages,
        keyQueuePriorityPending,
        keyQueueScheduled,
        keyQueueDL,
        keyQueueConsumerGroups,
      ];
      const argv: (string | number)[] = [
        // Queue Property Constants
        EQueueProperty.QUEUE_TYPE,
        EQueueProperty.MESSAGES_COUNT,
        EQueueProperty.PENDING_MESSAGES_COUNT,
        EQueueProperty.SCHEDULED_MESSAGES_COUNT,
        EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
        EQueueType.PRIORITY_QUEUE,
        EQueueType.LIFO_QUEUE,
        EQueueType.FIFO_QUEUE,

        // Message Status Constants
        EMessagePropertyStatus.PENDING,
        EMessagePropertyStatus.SCHEDULED,
        EMessagePropertyStatus.DEAD_LETTERED,

        // Message Property Constants
        EMessageProperty.ID,
        EMessageProperty.STATUS,
        EMessageProperty.MESSAGE,
        EMessageProperty.SCHEDULED_AT,
        EMessageProperty.PUBLISHED_AT,
        EMessageProperty.PROCESSING_STARTED_AT,
        EMessageProperty.DEAD_LETTERED_AT,
        EMessageProperty.ACKNOWLEDGED_AT,
        EMessageProperty.UNACKNOWLEDGED_AT,
        EMessageProperty.LAST_UNACKNOWLEDGED_AT,
        EMessageProperty.LAST_SCHEDULED_AT,
        EMessageProperty.REQUEUED_AT,
        EMessageProperty.REQUEUE_COUNT,
        EMessageProperty.LAST_REQUEUED_AT,
        EMessageProperty.LAST_RETRIED_ATTEMPT_AT,
        EMessageProperty.SCHEDULED_CRON_FIRED,
        EMessageProperty.ATTEMPTS,
        EMessageProperty.SCHEDULED_REPEAT_COUNT,
        EMessageProperty.EXPIRED,
        EMessageProperty.EFFECTIVE_SCHEDULED_DELAY,
        EMessageProperty.SCHEDULED_TIMES,
        EMessageProperty.SCHEDULED_MESSAGE_PARENT_ID,
        EMessageProperty.REQUEUED_MESSAGE_PARENT_ID,
      ];

      async.eachOf(
        messages,
        (msg, index, done) => {
          const messageId = msg.getId();
          this.logger.debug(
            `Processing message ${messageId} (${index + 1}/${messages.length})`,
          );

          const ts = Date.now();
          const scheduledMessageId = msg.getId();
          const consumerGroupId = msg.getConsumerGroupId();
          const { keyMessage: keyScheduledMessage } =
            redisKeys.getMessageKeys(scheduledMessageId);
          const nextScheduleTimestamp = msg.getNextScheduledTimestamp();
          const scheduledMessageState = msg.getMessageState();
          const messagePriority = msg.producibleMessage.getPriority() ?? '';
          const scheduledMessageCronFired = Number(
            scheduledMessageState.isScheduledCronFired(),
          );
          const scheduledMessageEffectiveScheduledDelay = Number(
            scheduledMessageState.getEffectiveScheduledDelay(),
          );
          const scheduledMessageRepeatCount =
            scheduledMessageState.getScheduledRepeatCount();

          let newMessageId = '';
          let newMessageJSON = '';
          let newMessagePublishedAt: string | number = '';
          let newKeyMessage = '';

          if (nextScheduleTimestamp) {
            // Repeating message: A new message is created and the original is rescheduled.
            const newMessage = _fromMessage(msg);
            newMessage.producibleMessage.resetScheduledParams();
            const newMessageState = newMessage
              .getMessageState()
              .setPublishedAt(ts)
              .setScheduledMessageParentId(scheduledMessageId);
            newMessageId = newMessageState.getId();
            newKeyMessage = redisKeys.getMessageKeys(newMessageId).keyMessage;
            newMessageJSON = JSON.stringify(newMessage.toJSON());
            newMessagePublishedAt = ts;

            scheduledMessageState.setLastScheduledAt(ts).incrScheduledTimes();
          } else {
            // Simple scheduled message: The message is moved to the pending queue.
            scheduledMessageState.setPublishedAt(ts);
          }

          const scheduledMessageScheduledTimes =
            scheduledMessageState.getScheduledTimes();
          const scheduledMessageLastScheduledAt =
            scheduledMessageState.getLastScheduledAt() ?? '';
          const scheduledMessagePublishedAt =
            scheduledMessageState.getPublishedAt() ?? '';

          // Dynamic keys for this message
          keys.push(newKeyMessage, keyScheduledMessage);

          // Dynamic arguments for this message
          argv.push(
            newMessageId,
            newMessageJSON,
            messagePriority,
            newMessagePublishedAt,
            scheduledMessageId,
            nextScheduleTimestamp,
            scheduledMessageLastScheduledAt,
            scheduledMessageScheduledTimes,
            scheduledMessagePublishedAt,
            scheduledMessageCronFired,
            scheduledMessageRepeatCount,
            scheduledMessageEffectiveScheduledDelay,
            consumerGroupId ?? '',
            ts,
          );
          done();
        },
        (err) => {
          if (err) {
            this.logger.error(
              'Error during message processing for enqueue',
              err,
            );
            return cb(err);
          }
          this.logger.debug(
            `Executing PUBLISH_SCHEDULED_MESSAGE script for ${messages.length} messages`,
          );
          redisClient.runScript(
            ELuaScriptName.PUBLISH_SCHEDULED,
            keys,
            argv,
            (err, reply) => {
              if (err) {
                this.logger.error(
                  'Error executing publish scheduled message script',
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
                  `Successfully published ${reply} scheduled messages.`,
                );
                return cb();
              }
              if (typeof reply === 'string') {
                this.logger.error(
                  `Script execution returned an error: ${reply}`,
                );
                return cb(
                  new PanicError(
                    `PUBLISH_SCHEDULED_MESSAGE script failed: ${reply}`,
                  ),
                );
              }
              this.logger.error(
                `Script execution returned unexpected response: ${reply}`,
              );
              cb(new PanicError(`Unexpected reply: ${reply}`));
            },
          );
        },
      );
    }, cb);
  };
}

export default workerBootstrap(PublishScheduledWorker);
