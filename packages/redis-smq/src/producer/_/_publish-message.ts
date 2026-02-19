/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { ERedisScriptName } from '../../common/redis/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import {
  EQueueOperationalState,
  EQueueProperty,
  EQueueType,
} from '../../queue-manager/index.js';
import {
  ConsumerGroupNotFoundError,
  InvalidQueueTypeError,
  MessageAlreadyExistsError,
  MessagePriorityRequiredError,
  PriorityQueuingNotEnabledError,
  QueueNotFoundError,
  UnexpectedScriptReplyError,
  InvalidQueueStateError,
  QueueStoppedError,
  QueueLockedError,
} from '../../errors/index.js';

/**
 * Enqueues/schedules a message onto the specified queue in Redis.
 *
 * This function is responsible for placing a message into a queue, setting its state,
 * and handling any errors that may occur during the process. It uses a Redis client
 * to execute a Lua script that manages the message's placement in the queue.
 *
 * @param redisClient - The Redis client used for communication with the Redis server.
 * @param message - The message to be enqueued/scheduled, wrapped in a MessageEnvelope.
 * @param logger - Logger for recording debug and error information.
 * @param cb - A callback function to be executed upon completion. It receives an error
 *             as the first argument (if any) and void as the second argument.
 */
export function _publishMessage(
  redisClient: IRedisClient,
  message: MessageEnvelope,
  logger: ILogger,
  cb: ICallback,
): void {
  const messageState = message.getMessageState();
  const messageId = message.getId();
  const destinationQueue = message.getDestinationQueue();
  const queueName = `${destinationQueue.name}@${destinationQueue.ns}`;
  const consumerGroupId = message.getConsumerGroupId();

  logger.debug(
    `Enqueuing message ${messageId} to queue ${queueName}${consumerGroupId ? ` for consumer group ${consumerGroupId}` : ''}`,
  );

  const keys = redisKeys.getQueueKeys(
    destinationQueue.ns,
    destinationQueue.name,
    consumerGroupId,
  );
  const { keyMessage } = redisKeys.getMessageKeys(messageId);
  const messagePriority = message.producibleMessage.getPriority();

  logger.debug(
    `Message ${messageId} details: priority=${messagePriority ?? 'none'}, queue=${queueName}`,
  );

  // Determines the message status based on its scheduling.
  // A message is considered scheduled if it has a future execution timestamp.
  const scheduledTimestamp = message.getNextScheduledTimestamp();
  const messageStatus = scheduledTimestamp
    ? EMessagePropertyStatus.SCHEDULED
    : EMessagePropertyStatus.PENDING;

  // ARGV layout for the publish-message.lua script (updated):
  // ARGV[1-13]: Queue property keys and state values (13 values)
  // ARGV[14-17]: Message priority and scheduling values (4 values)
  // ARGV[18-40]: Message property keys (23 keys)
  // ARGV[41-63]: Message property values (23 values)
  // ARGV[64]: consumerGroupId
  // ARGV[65]: operationLockId (optional, for locked queues)

  const queuePropertyValues = [
    EQueueProperty.QUEUE_TYPE,
    EQueueProperty.MESSAGES_COUNT,
    EQueueProperty.PENDING_MESSAGES_COUNT,
    EQueueProperty.SCHEDULED_MESSAGES_COUNT,
    EQueueType.PRIORITY_QUEUE,
    EQueueType.LIFO_QUEUE,
    EQueueType.FIFO_QUEUE,
    EQueueProperty.OPERATIONAL_STATE,
    EQueueProperty.LOCK_ID,
    EQueueOperationalState.ACTIVE,
    EQueueOperationalState.PAUSED,
    EQueueOperationalState.STOPPED,
    EQueueOperationalState.LOCKED,
  ];

  const schedulingValues = [
    messagePriority ?? '',
    scheduledTimestamp,
    EMessagePropertyStatus.SCHEDULED,
    EMessagePropertyStatus.PENDING,
  ];

  const messagePropertyKeys = [
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

  const messagePropertyValues = [
    // EMessageProperty order must be respected
    messageId, // ID
    messageStatus, // STATUS
    JSON.stringify(message.toJSON()), // MESSAGE
    messageState.getScheduledAt() ?? '', // SCHEDULED_AT
    messageState.getPublishedAt() ?? '', // PUBLISHED_AT
    messageState.getProcessingStartedAt() ?? '', // PROCESSING_STARTED_AT
    messageState.getDeadLetteredAt() ?? '', // DEAD_LETTERED_AT
    messageState.getAcknowledgedAt() ?? '', // ACKNOWLEDGED_AT
    messageState.getUnacknowledgedAt() ?? '', // UNACKNOWLEDGED_AT
    messageState.getLastUnacknowledgedAt() ?? '', // LAST_UNACKNOWLEDGED_AT
    messageState.getLastScheduledAt() ?? '', // LAST_SCHEDULED_AT
    messageState.getRequeuedAt() ?? '', // REQUEUED_AT
    messageState.getRequeueCount(), // REQUEUE_COUNT
    messageState.getLastRequeuedAt() ?? '', // LAST_REQUEUED_AT
    messageState.getLastRetriedAttemptAt() ?? '', // LAST_RETRIED_ATTEMPT_AT
    Number(messageState.isScheduledCronFired()), // SCHEDULED_CRON_FIRED
    messageState.getAttempts(), // ATTEMPTS
    messageState.getScheduledRepeatCount(), // SCHEDULED_REPEAT_COUNT
    Number(messageState.getExpired()), // EXPIRED
    messageState.getEffectiveScheduledDelay(), // EFFECTIVE_SCHEDULED_DELAY
    messageState.getScheduledTimes(), // SCHEDULED_TIMES
    messageState.getScheduledMessageParentId() ?? '', // SCHEDULED_MESSAGE_PARENT_ID
    messageState.getRequeuedMessageParentId() ?? '', // REQUEUED_MESSAGE_PARENT_ID
  ];

  const scriptArgs = [
    ...queuePropertyValues,
    ...schedulingValues,
    ...messagePropertyKeys,
    ...messagePropertyValues,
    consumerGroupId ?? '',
    '', // operationLockId - empty string for normal publishing (no lock required)
  ];

  redisClient.runScript(
    ERedisScriptName.PUBLISH_MESSAGE,
    [
      keys.keyQueueProperties,
      keys.keyQueuePriorityPending,
      keys.keyQueuePending,
      keys.keyQueueScheduled,
      keys.keyQueueMessages,
      keys.keyQueueConsumerGroups,
      keyMessage,
    ],
    scriptArgs,
    (err, reply) => {
      if (err) {
        logger.error(`Failed to publish message ${messageId}`, err);
        return cb(err);
      }

      switch (reply) {
        case 'OK':
          logger.debug(
            `Successfully published message ${messageId} to queue ${queueName}`,
          );
          return cb();
        case 'QUEUE_NOT_FOUND':
          logger.error(`Queue ${queueName} not found for message ${messageId}`);
          return cb(new QueueNotFoundError());
        case 'CONSUMER_GROUP_NOT_FOUND':
          logger.error(
            `Consumer group ${consumerGroupId} not found for queue ${queueName}`,
          );
          return cb(new ConsumerGroupNotFoundError());
        case 'MESSAGE_PRIORITY_REQUIRED':
          logger.error(
            `Priority required for message ${messageId} but not provided`,
          );
          return cb(new MessagePriorityRequiredError());
        case 'MESSAGE_ALREADY_EXISTS':
          logger.error(`A message with ${messageId} already exists`);
          return cb(new MessageAlreadyExistsError());
        case 'PRIORITY_QUEUING_NOT_ENABLED':
          logger.error(`Priority queuing not enabled for queue ${queueName}`);
          return cb(new PriorityQueuingNotEnabledError());
        case 'UNKNOWN_QUEUE_TYPE':
          logger.error(`Unknown queue type for queue ${queueName}`);
          return cb(new InvalidQueueTypeError());
        case 'QUEUE_STOPPED':
          logger.error(
            `Queue ${queueName} is in STOPPED state, cannot publish message ${messageId}`,
          );
          return cb(
            new QueueStoppedError({ metadata: { queue: destinationQueue } }),
          );
        case 'QUEUE_LOCKED':
          logger.error(
            `Queue ${queueName} is in LOCKED state, cannot publish message ${messageId}. Provide a valid lock ID to publish.`,
          );
          return cb(
            new QueueLockedError({ metadata: { queue: destinationQueue } }),
          );
        case 'QUEUE_INVALID_STATE':
          logger.error(
            `Queue ${queueName} is in invalid state, cannot publish message ${messageId}`,
          );
          return cb(
            new InvalidQueueStateError({
              metadata: {
                queue: destinationQueue,
              },
            }),
          );
        default:
          logger.error(
            `Unknown error while publishing message ${messageId}: ${reply}`,
          );
          return cb(new UnexpectedScriptReplyError({ metadata: { reply } }));
      }
    },
  );
}
