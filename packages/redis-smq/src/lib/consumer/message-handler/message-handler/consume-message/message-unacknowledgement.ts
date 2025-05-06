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
  logger,
  withRedisClient,
} from 'redis-smq-common';
import { RedisClient } from '../../../../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../../../config/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../../message/index.js';
import { MessageEnvelope } from '../../../../message/message-envelope.js';
import { IQueueParams } from '../../../../queue/index.js';
import { _getConsumerQueues } from '../../../consumer/_/_get-consumer-queues.js';
import { ConsumerError } from '../../../errors/index.js';
import { processingQueue } from './processing-queue.js';
import {
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementDeadLetterReason,
  EMessageUnacknowledgementReason,
  TMessageUnacknowledgementAction,
  TMessageUnacknowledgementStatus,
} from './types/index.js';

/**
 * Handles the unacknowledgement of messages in the message queue system.
 *
 * This class is responsible for determining what happens to messages that
 * were not successfully processed, including:
 * - Moving messages to dead letter queues
 * - Requeuing messages for retry
 * - Delaying messages before retry
 */
export class MessageUnacknowledgement {
  protected readonly logger;
  protected readonly redisClient;

  /**
   * Creates a new MessageUnacknowledgement instance.
   *
   * @param redisClient - The Redis client to use for operations
   */
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
  }

  /**
   * Determines the appropriate action to take for an unacknowledged message.
   *
   * @param message - The message envelope
   * @param unacknowledgedReason - The reason for unacknowledgement
   * @returns The action to take for the unacknowledged message
   */
  protected getMessageUnacknowledgementAction(
    message: MessageEnvelope,
    unacknowledgedReason: EMessageUnacknowledgementReason,
  ): TMessageUnacknowledgementAction {
    // Check if message TTL has expired
    if (
      unacknowledgedReason === EMessageUnacknowledgementReason.TTL_EXPIRED ||
      message.getSetExpired()
    ) {
      return {
        action: EMessageUnacknowledgementAction.DEAD_LETTER,
        deadLetterReason: EMessageUnacknowledgementDeadLetterReason.TTL_EXPIRED,
      };
    }

    // Handle periodic messages
    if (message.isPeriodic()) {
      // Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such
      // messages are periodically scheduled for delivery.
      return {
        action: EMessageUnacknowledgementAction.DEAD_LETTER,
        deadLetterReason:
          EMessageUnacknowledgementDeadLetterReason.PERIODIC_MESSAGE,
      };
    }

    // Check if retry threshold has been exceeded
    if (message.hasRetryThresholdExceeded()) {
      return {
        action: EMessageUnacknowledgementAction.DEAD_LETTER,
        deadLetterReason:
          EMessageUnacknowledgementDeadLetterReason.RETRY_THRESHOLD_EXCEEDED,
      };
    }

    // Determine if message should be delayed before retry
    const delay = message.producibleMessage.getRetryDelay();
    return delay
      ? { action: EMessageUnacknowledgementAction.DELAY }
      : { action: EMessageUnacknowledgementAction.REQUEUE };
  }

  /**
   * Prepares parameters for message unacknowledgement operation.
   *
   * @param consumerId - The ID of the consumer
   * @param messageOrQueue - Either a queue or a message envelope
   * @param unacknowledgementReason - The reason for unacknowledgement
   * @param done - Callback function
   */
  protected getMessageUnacknowledgementParameters(
    consumerId: string,
    messageOrQueue: MessageEnvelope | IQueueParams,
    unacknowledgementReason: EMessageUnacknowledgementReason,
    done: ICallback<{
      keys: string[];
      args: (string | number)[];
      unacknowledgementStatus: TMessageUnacknowledgementStatus;
    }>,
  ): void {
    // Determine if we're dealing with a message or just a queue
    const [queue, message] =
      messageOrQueue instanceof MessageEnvelope
        ? [messageOrQueue.getDestinationQueue(), messageOrQueue]
        : [messageOrQueue, null];

    const keys: string[] = [];
    const args: (string | number)[] = [];
    const unacknowledgementStatus: TMessageUnacknowledgementStatus = {};

    // Add queue and consumer information to args
    args.push(JSON.stringify(queue), consumerId);

    // Get all required Redis keys
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue,
      consumerId,
    );
    const {
      keyQueueDL,
      keyQueueProcessingQueues,
      keyQueueConsumers,
      keyQueueProperties,
      keyQueueDelayed,
      keyQueueRequeued,
    } = redisKeys.getQueueKeys(queue, null);

    // Add all keys to the keys array
    keys.push(
      keyQueueProcessing,
      keyQueueDelayed,
      keyQueueRequeued,
      keyQueueDL,
      keyQueueProcessingQueues,
      keyQueueConsumers,
      keyConsumerQueues,
      keyQueueProperties,
    );

    // If no message is provided, use default values
    if (!message) {
      keys.push('');
      args.push('', '', '', unacknowledgementReason, '');
      return done(null, { keys, args, unacknowledgementStatus });
    }

    // Add message-specific information
    const messageId = message.getId();
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    keys.push(keyMessage);
    args.push(messageId);

    // Determine the appropriate action for this message
    const unacknowledgementAction = this.getMessageUnacknowledgementAction(
      message,
      unacknowledgementReason,
    );
    const { action } = unacknowledgementAction;

    // Set the appropriate message status based on the action
    const messageStatus =
      action === EMessageUnacknowledgementAction.DEAD_LETTER
        ? EMessagePropertyStatus.DEAD_LETTERED
        : action === EMessageUnacknowledgementAction.REQUEUE
          ? EMessagePropertyStatus.UNACK_REQUEUING
          : EMessagePropertyStatus.UNACK_DELAYING;

    // Add action, reason, and status to args
    args.push(
      action,
      action === EMessageUnacknowledgementAction.DEAD_LETTER
        ? unacknowledgementAction.deadLetterReason
        : '',
      unacknowledgementReason,
      messageStatus,
    );

    // Record the action in the unacknowledgement status
    unacknowledgementStatus[messageId] = unacknowledgementAction;

    done(null, {
      args,
      keys,
      unacknowledgementStatus,
    });
  }

  /**
   * Executes the message unacknowledgement operation in Redis.
   *
   * @param keys - Redis keys to use in the operation
   * @param argv - Arguments for the Lua script
   * @param messageHandlingStatus - Status of message handling
   * @param cb - Callback function
   */
  protected executeMessageUnacknowledgement(
    keys: string[],
    argv: (string | number)[],
    messageHandlingStatus: TMessageUnacknowledgementStatus,
    cb: ICallback<TMessageUnacknowledgementStatus>,
  ): void {
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        // Get configuration for dead-lettered messages
        const { store, expire, queueSize } =
          Configuration.getSetConfig().messages.store.deadLettered;

        // Prepare arguments for the Lua script
        const execKeys: string[] = [...keys];
        const execArgs: (string | number)[] = [
          EMessageUnacknowledgementAction.DELAY,
          EMessageUnacknowledgementAction.REQUEUE,
          EMessageUnacknowledgementAction.DEAD_LETTER,
          Number(store),
          expire,
          queueSize * -1, // should be negative for proper trimming (to keep newest messages)
          EMessageProperty.STATUS,
          EMessageUnacknowledgementReason.OFFLINE_CONSUMER,
          EMessageUnacknowledgementReason.OFFLINE_MESSAGE_HANDLER,
          ...argv,
        ];

        // Execute the Lua script
        client.runScript(
          ELuaScriptName.HANDLE_PROCESSING_QUEUE,
          execKeys,
          execArgs,
          (err, reply) => {
            if (err) {
              return cb(err);
            }

            if (reply !== 'OK') {
              return cb(new ConsumerError(reply ? String(reply) : undefined));
            }

            // Log the status of each message
            Object.keys(messageHandlingStatus).forEach((messageId) => {
              const action =
                messageHandlingStatus[messageId].action ===
                EMessageUnacknowledgementAction.DEAD_LETTER
                  ? 'dead-lettered'
                  : 'unacknowledged';
              this.logger.debug(`Message ID ${messageId} has been ${action}.`);
            });

            cb(null, messageHandlingStatus);
          },
        );
      },
      cb,
    );
  }

  /**
   * Unacknowledges a specific message.
   *
   * @param consumerId - The ID of the consumer
   * @param msg - The message envelope
   * @param unacknowledgementReason - The reason for unacknowledgement
   * @param cb - Callback function
   */
  public unacknowledgeMessage(
    consumerId: string,
    msg: MessageEnvelope,
    unacknowledgementReason: EMessageUnacknowledgementReason,
    cb: ICallback<TMessageUnacknowledgementStatus>,
  ): void {
    this.getMessageUnacknowledgementParameters(
      consumerId,
      msg,
      unacknowledgementReason,
      (err, reply) => {
        if (err) return cb(err);
        if (!reply) return cb(new CallbackEmptyReplyError());

        const { keys, args, unacknowledgementStatus } = reply;
        this.executeMessageUnacknowledgement(
          keys,
          args,
          unacknowledgementStatus ?? {},
          cb,
        );
      },
    );
  }

  /**
   * Unacknowledges all messages currently being processed by a consumer.
   *
   * @param consumerId - The ID of the consumer
   * @param queues - Optional list of queues to check, or null to check all queues for the consumer
   * @param unacknowledgementReason - The reason for unacknowledgement
   * @param cb - Callback function
   */
  public unacknowledgeMessagesInProcess(
    consumerId: string,
    queues: IQueueParams[] | null,
    unacknowledgementReason: EMessageUnacknowledgementReason,
    cb: ICallback<TMessageUnacknowledgementStatus>,
  ): void {
    const keys: string[] = [];
    const args: (string | number)[] = [];
    const messageHandlingStatus: TMessageUnacknowledgementStatus = {};

    withRedisClient(
      this.redisClient,
      (client, cb) => {
        async.waterfall(
          [
            // Step 1: Get the list of queues for this consumer
            (next: ICallback<IQueueParams[]>) => {
              if (queues === null) _getConsumerQueues(client, consumerId, next);
              else next(null, queues);
            },

            // Step 2: Process each queue
            (queueParams: IQueueParams[], next: ICallback<void>) => {
              if (!queueParams.length) {
                return next();
              }

              async.eachOf(
                queueParams,
                (queue: IQueueParams, _: number, done: ICallback<void>) => {
                  const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
                    queue,
                    consumerId,
                  );

                  // Fetch messages from the processing queue
                  processingQueue.fetchMessageFromProcessingQueue(
                    this.redisClient,
                    keyQueueProcessing,
                    (err, message) => {
                      if (err) return done(err);

                      // Get parameters for unacknowledgement
                      async.withCallback(
                        (
                          cb: ICallback<{
                            keys: string[];
                            args: (string | number)[];
                            unacknowledgementStatus: TMessageUnacknowledgementStatus;
                          }>,
                        ) =>
                          this.getMessageUnacknowledgementParameters(
                            consumerId,
                            message ?? queue,
                            unacknowledgementReason,
                            cb,
                          ),
                        (reply, cb) => {
                          // Collect keys, args, and status information
                          keys.push(...reply.keys);
                          args.push(...reply.args);
                          Object.assign(
                            messageHandlingStatus,
                            reply.unacknowledgementStatus,
                          );
                          cb();
                        },
                        done,
                      );
                    },
                  );
                },
                next,
              );
            },
          ],
          (err) => {
            if (err) {
              return cb(err);
            }

            // If no keys were collected, there's nothing to do
            if (!keys.length) {
              return cb(null, {});
            }

            // Execute the unacknowledgement operation
            this.executeMessageUnacknowledgement(
              keys,
              args,
              messageHandlingStatus,
              cb,
            );
          },
        );
      },
      cb,
    );
  }
}
