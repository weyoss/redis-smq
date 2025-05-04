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
  CallbackInvalidReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { EQueueProperty, EQueueType } from '../../queue/index.js';
import {
  MessageInvalidParametersError,
  MessageMessageNotFoundError,
} from '../errors/index.js';
import {
  TMessageDeleteRawResponse,
  IMessageDeleteResponse,
  EMessageProperty,
  EMessagePropertyStatus,
} from '../types/index.js';
import { _getMessage } from './_get-message.js';

function isDeleteMessageResponse(
  reply: unknown,
): reply is TMessageDeleteRawResponse {
  return (
    // type-coverage:ignore-next-line
    typeof reply === 'string' || (Array.isArray(reply) && reply.length === 4)
  );
}

export function _deleteMessage(
  redisClient: IRedisClient,
  messageId: string | string[],
  cb: ICallback<IMessageDeleteResponse>,
): void {
  const keys: string[] = [];
  const argv: (string | number)[] = [];
  const ids = typeof messageId === 'string' ? [messageId] : messageId;
  argv.push(
    EQueueProperty.QUEUE_TYPE,
    EQueueProperty.MESSAGES_COUNT,
    EQueueType.PRIORITY_QUEUE,
    EQueueType.LIFO_QUEUE,
    EQueueType.FIFO_QUEUE,
    EMessageProperty.STATUS,
    EMessagePropertyStatus.PROCESSING,
    EMessagePropertyStatus.ACKNOWLEDGED,
    EMessagePropertyStatus.PENDING,
    EMessagePropertyStatus.SCHEDULED,
    EMessagePropertyStatus.DEAD_LETTERED,
    EMessagePropertyStatus.UNACK_DELAYING,
    EMessagePropertyStatus.UNACK_REQUEUING,
  );

  const deleteResponse: IMessageDeleteResponse = {
    status: 'MESSAGE_NOT_DELETED',
    stats: {
      processed: 0,
      success: 0,
      notFound: 0,
      inProcess: 0,
    },
  };

  const stats = deleteResponse.stats;

  // Skip message retrieval for empty array
  if (ids.length === 0) {
    return cb(null, deleteResponse);
  }

  async.each(
    ids,
    (id, _, done) => {
      _getMessage(redisClient, id, (err, message) => {
        if (err) {
          // If message not found, we'll assume it's already deleted
          if (err instanceof MessageMessageNotFoundError) {
            stats.notFound += 1;
            stats.processed += 1;
            return done();
          }
          return done(err);
        } else if (!message) done(new CallbackEmptyReplyError());
        else {
          const {
            keyQueueScheduled,
            keyQueueDelayed,
            keyQueueRequeued,
            keyQueueProperties,
            keyQueueDL,
            keyQueueAcknowledged,
            keyQueuePriorityPending,
            keyQueuePending,
            keyQueueMessages,
          } = redisKeys.getQueueKeys(
            message.getDestinationQueue(),
            message.getConsumerGroupId(),
          );
          const { keyMessage } = redisKeys.getMessageKeys(id);
          keys.push(
            keyQueueScheduled,
            keyQueueDelayed,
            keyQueueRequeued,
            keyMessage,
            keyQueueProperties,
            keyQueuePending,
            keyQueueDL,
            keyQueueAcknowledged,
            keyQueuePriorityPending,
            keyQueueMessages,
          );
          argv.push(id);
          done();
        }
      });
    },
    (err) => {
      if (err) return cb(err);

      if (keys.length && argv.length) {
        return redisClient.runScript(
          ELuaScriptName.DELETE_MESSAGE,
          keys,
          argv,
          (err, reply: unknown) => {
            if (err) return cb(err);
            if (!isDeleteMessageResponse(reply))
              return cb(new CallbackInvalidReplyError());
            if (typeof reply === 'string') {
              if (reply === 'INVALID_PARAMETERS')
                return cb(new MessageInvalidParametersError());
              return cb(new CallbackInvalidReplyError());
            }
            const [processed, success, notFound, inProcess] = reply;
            stats.processed += processed;
            stats.success += success;
            stats.notFound += notFound;
            stats.inProcess += inProcess;

            deleteResponse.status =
              (stats.processed === stats.success && 'OK') ||
              (stats.success && 'PARTIAL_SUCCESS') ||
              'MESSAGE_NOT_DELETED';

            cb(null, deleteResponse);
          },
        );
      }

      return cb(null, deleteResponse);
    },
  );
}
