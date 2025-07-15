/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  MessageError,
  MessageMessageNotRequeuableError,
} from '../index.js';
import { _fromMessage } from './_from-message.js';
import { _getMessage } from './_get-message.js';

export function _requeueMessage(
  redisClient: IRedisClient,
  messageId: string,
  cb: ICallback<string>,
): void {
  _getMessage(redisClient, messageId, (err, message) => {
    if (err) return cb(err);
    if (!message) return cb(new CallbackEmptyReplyError());
    if (
      ![
        EMessagePropertyStatus.ACKNOWLEDGED,
        EMessagePropertyStatus.DEAD_LETTERED,
      ].includes(message.getStatus())
    ) {
      return cb(new MessageMessageNotRequeuableError());
    }

    // The check for MessageMessageAlreadyRequeuedError has been removed
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
    } = redisKeys.getQueueKeys(destinationQueue, consumerGroupId);

    // Build KEYS array for the Lua script
    const keys: string[] = [
      // Static keys
      keyQueueProperties,
      keyQueuePriorityPending,
      keyQueuePending,
      keyQueueMessages,
      keyQueueScheduled,
      // Dynamic keys
      keyOriginalMessage,
      keyNewMessage,
    ];

    // Build ARGV array for the Lua script
    const argv: (string | number)[] = [
      // Queue Property Constants
      EQueueProperty.QUEUE_TYPE,
      EQueueProperty.MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
      EQueueProperty.SCHEDULED_MESSAGES_COUNT,
      EQueueType.PRIORITY_QUEUE,
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,

      // Message Status Constants
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PENDING,
      EMessagePropertyStatus.SCHEDULED,

      // Message Property Constants
      EMessageProperty.ID,
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

      // Dynamic ARGV for the message
      newChildMessageId,
      JSON.stringify(newMessage.toJSON()),
      message.producibleMessage.getPriority() ?? '',
      ts, // newChildMessagePublishedAt
      message.getMessageState().getRequeuedAt() ?? ts, // requeuedAt
      ts, // lastRequeuedAt
    ];

    redisClient.runScript(
      ELuaScriptName.REQUEUE_MESSAGE,
      keys,
      argv,
      (err, reply) => {
        if (err) return cb(err);

        // The script returns the number of successfully requeued messages.
        // For a single message, this should be 1.
        if (reply === 1) return cb(null, newChildMessageId);

        // The script returns 0 if the original message does not exist.
        if (reply === 0) {
          return cb(
            new MessageError(
              `Could not requeue message ID ${messageId}. Message not found.`,
            ),
          );
        }

        if (typeof reply === 'string') {
          return cb(
            new MessageError(
              `Failed to requeue message. Got error from LUA script: ${reply}`,
            ),
          );
        }

        cb(new MessageError(`Expected 1 or an error string, got ${reply}`));
      },
    );
  });
}
