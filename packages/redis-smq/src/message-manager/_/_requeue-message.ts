/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { ERedisScriptName } from '../../common/redis/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  EQueueOperationalState,
  EQueueProperty,
  EQueueType,
} from '../../queue-manager/index.js';
import {
  MessageNotFoundError,
  MessageNotRequeuableError,
  RequeueMessageScriptError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import { _fromMessage } from './_from-message.js';
import { _getMessage } from './_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';

export function _requeueMessage(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<string>,
): void {
  async.waterfall(
    [
      (cb: ICallback<MessageEnvelope>) => {
        _getMessage(redisClient, messageId, (err, message) => {
          if (err) return cb(err);
          if (!message) return cb(new CallbackEmptyReplyError());
          if (
            ![
              EMessagePropertyStatus.ACKNOWLEDGED,
              EMessagePropertyStatus.DEAD_LETTERED,
            ].includes(message.getStatus())
          ) {
            return cb(new MessageNotRequeuableError());
          }
          cb(null, message);
        });
      },
      (message: MessageEnvelope, cb: ICallback<MessageEnvelope>) => {
        const queue = message.getDestinationQueue();
        _validateOperation(
          redisClient,
          queue,
          EQueueOperation.REQUEUE_MESSAGE,
          (err) => {
            if (err) return cb(err);
            cb(null, message);
          },
        );
      },
      (message: MessageEnvelope, cb: ICallback<string>) => {
        // The check for MessageManagerMessageAlreadyRequeuedError has been removed
        // to allow a message to be requeued multiple times. The Lua script now handles this logic.

        const ts = Date.now();

        // Create a new message based on the original one.
        // The new message will be published, while the original is just updated with tracking info.
        const newMessage = _fromMessage(message);
        newMessage.producibleMessage.resetScheduledParams();
        const newMessageState = newMessage
          .getMessageState()
          .setPublishedAt(ts)
          .setRequeuedMessageParentId(messageId);

        const { keyMessage: keyOriginalMessage } =
          redisKeys.getMessageKeys(messageId);

        const newChildMessageId = newMessageState.getId();
        const { keyMessage: keyNewMessage } =
          redisKeys.getMessageKeys(newChildMessageId);

        const destinationQueue = message.getDestinationQueue();
        const consumerGroupId = message.getConsumerGroupId();

        const {
          keyQueueProperties,
          keyQueuePending,
          keyQueuePriority,
          keyQueuePublished,
          keyQueueScheduled,
          keyQueueConsumerGroups,
        } = redisKeys.getQueueKeys(
          destinationQueue.ns,
          destinationQueue.name,
          consumerGroupId,
        );

        // Build KEYS array for the Lua script
        const keys: string[] = [
          // Static keys (1-6)
          keyQueueProperties,
          keyQueuePriority,
          keyQueuePending,
          keyQueuePublished,
          keyQueueScheduled,
          keyQueueConsumerGroups,
          // Dynamic keys (7-8)
          keyOriginalMessage,
          keyNewMessage,
        ];

        // Build ARGV array for the Lua script
        const argv: (string | number)[] = [
          // Queue Property Constants (ARGV[1-13])
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

          // Message Status Constants (ARGV[14-15])
          EMessagePropertyStatus.SCHEDULED,
          EMessagePropertyStatus.PENDING,

          // Message Property Keys (ARGV[16-39]) - 24 keys
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
          EMessageProperty.LAST_PROCESSED_AT,

          '', // ARGV[40] operationLockId

          newChildMessageId, // ARGV[41] newChildMessageId
          JSON.stringify(newMessage.toJSON()), // ARGV[42] newChildMessage
          message.producibleMessage.getPriority() ?? '', // ARGV[43] newChildMessagePriority
          ts, // ARGV[44] - newChildMessagePublishedAt
          message.getMessageState().getRequeuedAt() ?? ts, // ARGV[45] - requeuedAt
          ts, // ARGV[46] - lastRequeuedAt
          consumerGroupId ?? '', // ARGV[47]
        ];

        redisClient.runScript(
          ERedisScriptName.REQUEUE_MESSAGE,
          keys,
          argv,
          (err, reply) => {
            if (err) return cb(err);

            // The script returns the number of successfully requeued messages.
            // For a single message, this should be 1.
            if (reply === 1) return cb(null, newChildMessageId);

            // The script returns 0 if the original message or consumer group does not exist.
            if (reply === 0) {
              return cb(
                new MessageNotFoundError({
                  message: `Could not requeue message ID ${messageId}. Message or consumer group not found.`,
                }),
              );
            }

            if (typeof reply === 'string') {
              // Handle queue state errors and other script-level errors
              if (reply.startsWith('REQUEUE_ERROR:')) {
                return cb(
                  new RequeueMessageScriptError({
                    metadata: {
                      scriptReply: reply,
                    },
                  }),
                );
              }

              return cb(
                new RequeueMessageScriptError({
                  metadata: {
                    scriptReply: reply,
                  },
                }),
              );
            }

            cb(
              new UnexpectedScriptReplyError({
                metadata: { reply },
              }),
            );
          },
        );
      },
    ],
    cb,
  );
}
