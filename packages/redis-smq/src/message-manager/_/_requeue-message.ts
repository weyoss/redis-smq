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
  EQueueProperty,
  EQueueType,
  EQueueOperationalState,
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
          keyQueuePriorityPending,
          keyQueueMessages,
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
          keyQueuePriorityPending,
          keyQueuePending,
          keyQueueMessages,
          keyQueueScheduled,
          keyQueueConsumerGroups,
          // Dynamic keys (7-8)
          keyOriginalMessage,
          keyNewMessage,
        ];

        // Build ARGV array for the Lua script
        // ARGV layout for requeue-message.lua (updated):
        // ARGV[1-40]: Constants (13 queue + 3 status + 24 message = 40)
        // ARGV[41]: operationLockId (single parameter for entire batch)
        // ARGV[42-48]: Message-specific parameters (7 values)
        const argv: (string | number)[] = [
          // Queue Property Constants (1-13)
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

          // Message Status Constants (14-16) - Reordered to match Lua script
          EMessagePropertyStatus.SCHEDULED, // ARGV[14] - EMessagePropertyStatusScheduled
          EMessagePropertyStatus.PENDING, // ARGV[15] - EMessagePropertyStatusPending
          EMessageProperty.STATUS, // ARGV[16] - EMessagePropertyStatus (generic)

          // Message Property Constants (17-40) - 24 keys
          EMessageProperty.ID, // 17
          EMessageProperty.STATUS, // 18 - Used as STATUS field key
          EMessageProperty.MESSAGE, // 19
          EMessageProperty.SCHEDULED_AT, // 20
          EMessageProperty.PUBLISHED_AT, // 21
          EMessageProperty.PROCESSING_STARTED_AT, // 22
          EMessageProperty.DEAD_LETTERED_AT, // 23
          EMessageProperty.ACKNOWLEDGED_AT, // 24
          EMessageProperty.UNACKNOWLEDGED_AT, // 25
          EMessageProperty.LAST_UNACKNOWLEDGED_AT, // 26
          EMessageProperty.LAST_SCHEDULED_AT, // 27
          EMessageProperty.REQUEUED_AT, // 28
          EMessageProperty.REQUEUE_COUNT, // 29
          EMessageProperty.LAST_REQUEUED_AT, // 30
          EMessageProperty.LAST_RETRIED_ATTEMPT_AT, // 31
          EMessageProperty.SCHEDULED_CRON_FIRED, // 32
          EMessageProperty.ATTEMPTS, // 33
          EMessageProperty.SCHEDULED_REPEAT_COUNT, // 34
          EMessageProperty.EXPIRED, // 35
          EMessageProperty.EFFECTIVE_SCHEDULED_DELAY, // 36
          EMessageProperty.SCHEDULED_TIMES, // 37
          EMessageProperty.SCHEDULED_MESSAGE_PARENT_ID, // 38
          EMessageProperty.REQUEUED_MESSAGE_PARENT_ID, // 39
          // Note: ARGV[40] is not used in this script (DEAD_LETTERED_MESSAGES_COUNT in other scripts)
          // But we need to account for it in the offset
          '', // Placeholder for ARGV[40] - not used but maintains correct offsets

          // Operation Lock ID (41) - empty for normal operations
          '',

          // Dynamic ARGV for the message (42-48)
          newChildMessageId, // 42
          JSON.stringify(newMessage.toJSON()), // 43
          message.producibleMessage.getPriority() ?? '', // 44
          ts, // 45 - newChildMessagePublishedAt
          message.getMessageState().getRequeuedAt() ?? ts, // 46 - requeuedAt
          ts, // 47 - lastRequeuedAt
          consumerGroupId ?? '', // 48
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
