/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  PanicError,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { _getMessage } from '../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { EQueueProperty } from '../../queue/index.js';
import { IConsumerMessageHandlerWorkerPayload } from '../types/index.js';
import { Worker } from './worker.js';

class DelayUnacknowledgedWorker extends Worker {
  work = (cb: ICallback<void>): void => {
    this.logger.debug('Starting DelayUnacknowledgedWorker work cycle');

    const {
      keyQueueDelayed,
      keyQueueScheduled,
      keyQueueProperties,
      keyQueueMessages,
    } = redisKeys.getQueueKeys(
      this.queueParsedParams.queueParams,
      this.queueParsedParams.groupId,
    );

    this.logger.debug(
      `Working with queue: ${this.queueParsedParams.queueParams.name}, group: ${this.queueParsedParams.groupId || 'none'}`,
    );

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error('Failed to get Redis client instance', redisClient);
      cb(redisClient);
      return void 0;
    }

    this.logger.debug(`Fetching delayed messages from ${keyQueueDelayed}`);
    redisClient.lrange(keyQueueDelayed, 0, 9, (err, reply) => {
      if (err) {
        this.logger.error('Error fetching delayed messages', err);
        cb(err);
      } else {
        const messageIds = reply ?? [];
        this.logger.debug(
          `Found ${messageIds.length} delayed messages to process`,
        );

        if (messageIds.length) {
          const keys: string[] = [];
          const args: (string | number)[] = [
            EQueueProperty.QUEUE_TYPE,
            EQueueProperty.MESSAGES_COUNT,
            EMessageProperty.MESSAGE,
            EMessageProperty.STATUS,
            EMessagePropertyStatus.SCHEDULED,
            EMessageProperty.STATE,
            '1',
          ];

          this.logger.debug('Processing delayed messages batch');
          async.each(
            messageIds,
            (messageId, _, done) => {
              this.logger.debug(`Processing delayed message: ${messageId}`);
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
                  this.logger.debug(
                    `Preparing message ${messageId} for scheduling`,
                  );

                  const { keyMessage } = redisKeys.getMessageKeys(messageId);
                  keys.push(
                    keyQueueMessages,
                    keyQueueProperties,
                    keyMessage,
                    keyQueueScheduled,
                    keyQueueDelayed,
                  );
                  args.push(messageId, '');

                  const delay = message.producibleMessage.getRetryDelay();
                  this.logger.debug(
                    `Message ${messageId} retry delay: ${delay}ms`,
                  );

                  const messageState = message.getMessageState();
                  const previousAttempts = messageState.getAttempts();
                  messageState.incrAttempts();
                  messageState.setNextRetryDelay(delay);

                  this.logger.debug(
                    `Message ${messageId} attempts incremented from ${previousAttempts} to ${messageState.getAttempts()}`,
                  );

                  const timestamp = message.getNextScheduledTimestamp();
                  this.logger.debug(
                    `Message ${messageId} scheduled for timestamp: ${timestamp}`,
                  );

                  args.push(timestamp, JSON.stringify(messageState));
                  done();
                }
              });
            },
            (err) => {
              if (err) {
                this.logger.error(
                  'Error processing delayed messages batch',
                  err,
                );
                cb(err);
              } else {
                this.logger.debug(
                  'Running SCHEDULE_MESSAGE script for delayed messages',
                );
                redisClient.runScript(
                  ELuaScriptName.SCHEDULE_MESSAGE,
                  keys,
                  args,
                  (err, reply) => {
                    if (err) {
                      this.logger.error(
                        'Error running SCHEDULE_MESSAGE script',
                        err,
                      );
                      cb(err);
                    } else if (!reply) {
                      this.logger.error(
                        'Empty reply from SCHEDULE_MESSAGE script',
                      );
                      cb(new CallbackEmptyReplyError());
                    } else if (reply !== 'OK') {
                      this.logger.error(
                        `Unexpected reply from SCHEDULE_MESSAGE script: ${reply}`,
                      );
                      cb(new PanicError(String(reply)));
                    } else {
                      this.logger.debug(
                        'Successfully scheduled delayed messages',
                      );
                      cb();
                    }
                  },
                );
              }
            },
          );
        } else {
          this.logger.debug('No delayed messages to process');
          cb();
        }
      }
    });
  };
}

export default (payload: IConsumerMessageHandlerWorkerPayload) =>
  new DelayUnacknowledgedWorker(payload);
