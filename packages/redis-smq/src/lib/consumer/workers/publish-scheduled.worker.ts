/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, PanicError } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _fromMessage } from '../../message/_/_from-message.js';
import { _getMessages } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { MessageState } from '../../message/message-state.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import { IConsumerMessageHandlerWorkerPayload } from '../types/index.js';
import { Worker } from './worker.js';

class PublishScheduledWorker extends Worker {
  work = (cb: ICallback<void>): void => {
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

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance', redisClient);
      cb(redisClient);
      return void 0;
    }

    const { keyQueueScheduled } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );

    this.logger.debug(`Using scheduled queue key: ${keyQueueScheduled}`);
    const currentTimestamp = Date.now();

    redisClient.zrangebyscore(
      keyQueueScheduled,
      0,
      currentTimestamp,
      0,
      9,
      (err, ids) => {
        if (err) {
          this.logger.error('Error fetching scheduled message IDs', err);
          cb(err);
        } else {
          const messageCount = ids?.length || 0;
          this.logger.debug(
            `Found ${messageCount} scheduled messages ready for publishing (current timestamp: ${currentTimestamp})`,
          );
          cb(null, ids || []);
        }
      },
    );
  };

  protected fetchMessages = (
    ids: string[],
    cb: ICallback<MessageEnvelope[]>,
  ): void => {
    if (!ids.length) {
      this.logger.debug('No message IDs to fetch, skipping message retrieval');
      cb(null, []);
      return void 0;
    }

    this.logger.debug(`Fetching ${ids.length} messages from storage`);

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance', redisClient);
      cb(redisClient);
      return void 0;
    }

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
  };

  protected enqueueMessages = (
    messages: MessageEnvelope[],
    cb: ICallback<void>,
  ): void => {
    if (!messages.length) {
      this.logger.debug('No messages to enqueue, work cycle complete');
      cb();
      return void 0;
    }

    this.logger.debug(`Preparing to enqueue ${messages.length} messages`);

    const keys: string[] = [];
    const argv: (string | number)[] = [
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PENDING,
      EMessageProperty.STATE,
      EQueueProperty.QUEUE_TYPE,
      EQueueType.PRIORITY_QUEUE,
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,
      EQueueProperty.MESSAGES_COUNT,
      EMessageProperty.MESSAGE,
    ];

    async.eachOf(
      messages,
      (msg, index, done) => {
        const messageId = msg.getId();
        this.logger.debug(
          `Processing message ${messageId} (${index + 1}/${messages.length})`,
        );

        const ts = Date.now();
        const messagePriority = msg.producibleMessage.getPriority() ?? '';
        const { keyMessage: keyScheduledMessage } =
          redisKeys.getMessageKeys(messageId);
        const nextScheduleTimestamp = msg.getNextScheduledTimestamp();
        const scheduledMessageState = msg.getMessageState();
        const destinationQueue = msg.getDestinationQueue();
        const consumerGroupId = msg.getConsumerGroupId();

        this.logger.debug(
          `Message ${messageId} destination: ${destinationQueue.ns}:${destinationQueue.name}, consumer group: ${consumerGroupId || 'none'}`,
        );

        const {
          keyQueueProperties,
          keyQueuePending,
          keyQueuePriorityPending,
          keyQueueScheduled,
          keyQueueMessages,
        } = redisKeys.getQueueKeys(destinationQueue, consumerGroupId);

        let newMessage: MessageEnvelope | null = null;
        let newMessageState: MessageState | null = null;
        let newMessageId: string = '';
        let newKeyMessage: string = '';

        if (nextScheduleTimestamp) {
          this.logger.debug(
            `Message ${messageId} has next schedule timestamp: ${nextScheduleTimestamp}, creating new message instance`,
          );

          newMessage = _fromMessage(msg, null, null);
          newMessage.producibleMessage.resetScheduledParams();
          newMessageState = newMessage
            .getMessageState()
            .setPublishedAt(ts)
            .setScheduledMessageId(messageId);
          newMessageId = newMessageState.getId();
          newKeyMessage = redisKeys.getMessageKeys(newMessageId).keyMessage;
          scheduledMessageState.setLastScheduledAt(ts);

          this.logger.debug(
            `Created new message with ID ${newMessageId} from scheduled message ${messageId}`,
          );
        } else {
          this.logger.debug(
            `Message ${messageId} has no next schedule timestamp, updating existing message`,
          );
          scheduledMessageState.setPublishedAt(ts);
        }

        keys.push(
          newKeyMessage,
          keyQueuePending,
          keyQueueMessages,
          keyQueueProperties,
          keyQueuePriorityPending,
          keyQueueScheduled,
          keyScheduledMessage,
        );
        argv.push(
          newMessageId,
          newMessage ? JSON.stringify(newMessage) : '',
          newMessageState ? JSON.stringify(newMessageState) : '',
          messagePriority,
          messageId,
          nextScheduleTimestamp,
          JSON.stringify(scheduledMessageState),
        );
        done();
      },
      (err) => {
        if (err) {
          this.logger.error('Error during message processing for enqueue', err);
          cb(err);
        } else {
          this.logger.debug(
            `Executing PUBLISH_SCHEDULED_MESSAGE script for ${messages.length} messages`,
          );

          const redisClient = this.redisClient.getInstance();
          if (redisClient instanceof Error) {
            this.logger.error(
              'Failed to get Redis client instance',
              redisClient,
            );
            cb(redisClient);
            return void 0;
          }

          redisClient.runScript(
            ELuaScriptName.PUBLISH_SCHEDULED_MESSAGE,
            keys,
            argv,
            (err, reply) => {
              if (err) {
                this.logger.error(
                  'Error executing publish scheduled message script',
                  err,
                );
                cb(err);
              } else if (reply !== 'OK') {
                this.logger.error(
                  `Script execution returned unexpected response: ${reply}`,
                );
                cb(new PanicError(String(reply)));
              } else {
                this.logger.info(
                  `Successfully published ${messages.length} scheduled messages`,
                );
                cb();
              }
            },
          );
        }
      },
    );
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new PublishScheduledWorker(payload);
