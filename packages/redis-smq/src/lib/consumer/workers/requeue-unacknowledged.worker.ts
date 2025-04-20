/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _getMessage } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import { IConsumerMessageHandlerWorkerPayload } from '../types/index.js';
import { Worker } from './worker.js';

class RequeueUnacknowledgedWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    this.logger.debug('Starting requeue unacknowledged messages work cycle');

    const { keyQueueRequeued, keyQueueProperties } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );

    this.logger.debug(
      `Queue: ${this.queueParsedParams.queueParams.ns}:${this.queueParsedParams.queueParams.name}, GroupId: ${this.queueParsedParams.groupId || 'none'}`,
    );
    this.logger.debug(`Using requeued queue key: ${keyQueueRequeued}`);

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance', redisClient);
      cb(redisClient);
      return void 0;
    }

    redisClient.lrange(keyQueueRequeued, 0, 99, (err, reply) => {
      if (err) {
        this.logger.error('Error retrieving messages from requeued queue', err);
        cb(err);
      } else {
        const messageIds = reply ?? [];
        const messageCount = messageIds.length;

        this.logger.debug(`Found ${messageCount} messages to requeue`);

        if (messageCount) {
          const keys: string[] = [keyQueueRequeued, keyQueueProperties];
          const argv: (string | number)[] = [
            EQueueProperty.QUEUE_TYPE,
            EQueueType.PRIORITY_QUEUE,
            EQueueType.LIFO_QUEUE,
            EQueueType.FIFO_QUEUE,
            EMessageProperty.STATUS,
            EMessagePropertyStatus.PENDING,
            EMessageProperty.STATE,
          ];

          this.logger.debug('Processing messages for requeue operation');

          async.eachOf(
            messageIds,
            (messageId, index, done) => {
              this.logger.debug(
                `Processing message ${messageId} (${index + 1}/${messageCount})`,
              );

              _getMessage(redisClient, messageId, (err, message) => {
                if (err) {
                  this.logger.error(
                    `Error retrieving message ${messageId}`,
                    err,
                  );
                  done(err);
                } else if (!message) {
                  this.logger.error(`Message ${messageId} not found`);
                  cb(new CallbackEmptyReplyError());
                } else {
                  const messageId = message.getId();
                  const messageState = message.getMessageState();
                  const destinationQueue = message.getDestinationQueue();
                  const consumerGroupId = message.getConsumerGroupId();

                  this.logger.debug(
                    `Preparing to requeue message ${messageId} to ${destinationQueue.ns}:${destinationQueue.name}, consumer group: ${consumerGroupId || 'none'}`,
                  );

                  const { keyQueuePriorityPending, keyQueuePending } =
                    redisKeys.getQueueKeys(destinationQueue, consumerGroupId);
                  const { keyMessage } = redisKeys.getMessageKeys(messageId);
                  keys.push(
                    keyQueuePriorityPending,
                    keyQueuePending,
                    keyMessage,
                  );

                  const previousAttempts = messageState.getAttempts();
                  messageState.incrAttempts();
                  const newAttempts = messageState.getAttempts();

                  this.logger.debug(
                    `Incremented message ${messageId} attempts from ${previousAttempts} to ${newAttempts}`,
                  );

                  const messagePriority =
                    message.producibleMessage.getPriority() ?? '';
                  argv.push(
                    messageId,
                    messagePriority,
                    JSON.stringify(messageState),
                  );
                  done();
                }
              });
            },
            (err) => {
              if (err) {
                this.logger.error(
                  'Error during message processing for requeue',
                  err,
                );
                cb(err);
              } else {
                this.logger.debug(
                  `Executing REQUEUE_MESSAGE script with ${messageCount} messages`,
                );

                redisClient.runScript(
                  ELuaScriptName.REQUEUE_MESSAGE,
                  keys,
                  argv,
                  (err) => {
                    if (err) {
                      this.logger.error('Error executing requeue script', err);
                      cb(err);
                    } else {
                      this.logger.info(
                        `Successfully requeued ${messageCount} messages`,
                      );
                      cb();
                    }
                  },
                );
              }
            },
          );
        } else {
          this.logger.debug('No messages to requeue, work cycle complete');
          cb();
        }
      }
    });
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new RequeueUnacknowledgedWorker(payload);
