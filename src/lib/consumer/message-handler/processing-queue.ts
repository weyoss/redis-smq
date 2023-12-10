/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EMessageProperty,
  EMessagePropertyStatus,
  EConsumeMessageUnacknowledgedCause,
  IQueueParams,
} from '../../../../types';
import { MessageEnvelope } from '../../message/message-envelope';
import {
  async,
  RedisClient,
  ICallback,
  ILogger,
  IRedisTransaction,
} from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import {
  ERetryAction,
  getRetryAction,
  TGetRetryActionReply,
} from './retry-message';
import { consumerQueues } from '../consumer-queues';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { _getMessage } from '../../message/_get-message';
import { Configuration } from '../../../config/configuration';
import { ConsumerError } from '../errors';

export type THandleProcessingQueueReply = TGetRetryActionReply | false;

export const processingQueue = {
  handleProcessingQueue(
    redisClient: RedisClient,
    consumerIds: string[],
    queues: IQueueParams[],
    logger: ILogger,
    unacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<THandleProcessingQueueReply>,
  ): void {
    let retryActionReply: TGetRetryActionReply | false = false;
    if (consumerIds.length) {
      const { store, expire, queueSize } =
        Configuration.getSetConfig().messages.store.deadLettered;
      const {
        keyProcessingQueues,
        keyHeartbeats,
        keyHeartbeatConsumerWeight,
        keyDelayedMessages,
        keyRequeueMessages,
      } = redisKeys.getMainKeys();
      const keys: string[] = [
        keyProcessingQueues,
        keyHeartbeats,
        keyHeartbeatConsumerWeight,
        keyDelayedMessages,
        keyRequeueMessages,
      ];
      const args: (string | number)[] = [
        ERetryAction.DELAY,
        ERetryAction.REQUEUE,
        ERetryAction.DEAD_LETTER,
        Number(store),
        expire,
        queueSize * -1,
        EMessageProperty.STATUS,
        EConsumeMessageUnacknowledgedCause.OFFLINE_CONSUMER,
        EConsumeMessageUnacknowledgedCause.OFFLINE_MESSAGE_HANDLER,
      ];
      const debugInfo: string[] = [];
      async.each(
        consumerIds,
        (consumerId, key, done) => {
          async.waterfall(
            [
              (cb: ICallback<IQueueParams[]>) => {
                if (queues.length) cb(null, queues);
                else {
                  consumerQueues.getConsumerQueues(redisClient, consumerId, cb);
                }
              },
              (queues: IQueueParams[], cb: ICallback<void>) => {
                if (queues.length) {
                  async.each(
                    queues,
                    (queue, _, done) => {
                      args.push(JSON.stringify(queue));
                      args.push(consumerId);
                      const {
                        keyQueueProcessing,
                        keyQueueDL,
                        keyQueueProcessingQueues,
                        keyQueueConsumers,
                        keyConsumerQueues,
                        keyQueueProperties,
                      } = redisKeys.getQueueConsumerKeys(queue, consumerId);
                      keys.push(
                        keyQueueProcessing,
                        keyQueueDL,
                        keyQueueProcessingQueues,
                        keyQueueConsumers,
                        keyConsumerQueues,
                        keyQueueProperties,
                      );
                      this.fetchProcessingQueueMessage(
                        redisClient,
                        keyQueueProcessing,
                        (err, message) => {
                          if (err) done(err);
                          else {
                            if (message) {
                              const messageId = message.getRequiredId();
                              args.push(messageId);
                              const { keyMessage } =
                                redisKeys.getMessageKeys(messageId);
                              keys.push(keyMessage);
                              retryActionReply = getRetryAction(
                                message,
                                unacknowledgedCause,
                              );
                              const { action } = retryActionReply;
                              const messageStatus =
                                action === ERetryAction.DEAD_LETTER
                                  ? EMessagePropertyStatus.DEAD_LETTERED
                                  : action === ERetryAction.REQUEUE
                                  ? EMessagePropertyStatus.UNACK_REQUEUING
                                  : EMessagePropertyStatus.UNACK_DELAYING;
                              args.push(
                                action,
                                action === ERetryAction.DEAD_LETTER
                                  ? retryActionReply.deadLetterCause
                                  : '',
                                unacknowledgedCause,
                                messageStatus,
                              );
                              debugInfo.push(
                                `Message ID ${messageId} has been ${
                                  action === ERetryAction.DEAD_LETTER
                                    ? 'dead-lettered'
                                    : 'unacknowledged'
                                }.`,
                              );
                            } else {
                              keys.push('');
                              args.push('', '', '', unacknowledgedCause, '');
                            }
                            done();
                          }
                        },
                      );
                    },
                    cb,
                  );
                } else {
                  const { keyConsumerQueues } =
                    redisKeys.getConsumerKeys(consumerId);
                  keys.push('', '', '', '', keyConsumerQueues, '', '');
                  args.push(
                    '',
                    consumerId,
                    '',
                    '',
                    '',
                    unacknowledgedCause,
                    '',
                  );
                  cb();
                }
              },
            ],
            done,
          );
        },
        (err) => {
          if (err) cb(err);
          else {
            redisClient.runScript(
              ELuaScriptName.HANDLE_PROCESSING_QUEUE,
              keys,
              args,
              (err, reply) => {
                if (err) cb(err);
                else if (reply !== 'OK')
                  cb(new ConsumerError(reply ? String(reply) : undefined));
                else {
                  debugInfo.forEach((i) => logger.debug(i));
                  cb(null, retryActionReply);
                }
              },
            );
          }
        },
      );
    } else cb(null, retryActionReply);
  },

  fetchProcessingQueueMessage(
    redisClient: RedisClient,
    keyQueueProcessing: string,
    cb: ICallback<MessageEnvelope>,
  ): void {
    redisClient.lrange(
      keyQueueProcessing,
      0,
      0,
      (err?: Error | null, range?: string[] | null) => {
        if (err) cb(err);
        else if (range && range.length) _getMessage(redisClient, range[0], cb);
        else cb();
      },
    );
  },

  setUpProcessingQueue(
    multi: IRedisTransaction,
    queue: IQueueParams,
    consumerId: string,
  ): void {
    const {
      keyQueueProcessing,
      keyProcessingQueues,
      keyQueueProcessingQueues,
    } = redisKeys.getQueueConsumerKeys(queue, consumerId);
    multi.hset(keyQueueProcessingQueues, keyQueueProcessing, consumerId);
    multi.sadd(keyProcessingQueues, keyQueueProcessing);
  },

  getQueueProcessingQueues(
    redisClient: RedisClient,
    queue: IQueueParams,
    cb: ICallback<Record<string, string>>,
  ): void {
    const { keyQueueProcessingQueues } = redisKeys.getQueueKeys(queue);
    redisClient.hgetall(keyQueueProcessingQueues, cb);
  },
};
