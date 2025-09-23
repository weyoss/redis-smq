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
  CallbackInvalidReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import {
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../queue-manager/index.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { MessageEnvelope } from '../../message/message-envelope.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { _getMessage } from './_get-message.js';
import { MessageNotFoundError } from '../../errors/index.js';
import { IMessageManagerDeleteResponse } from '../types/index.js';

export function _deleteMessage(
  redisClient: IRedisClient,
  messageId: string | string[],
  cb: ICallback<IMessageManagerDeleteResponse>,
): void {
  const deleteResponse: IMessageManagerDeleteResponse = {
    status: 'MESSAGE_NOT_DELETED',
    stats: {
      processed: 0,
      success: 0,
      notFound: 0,
      inProcess: 0,
    },
  };
  const ids = Array.isArray(messageId) ? messageId : [messageId];
  if (!ids.length) {
    deleteResponse.status = 'OK';
    return cb(null, deleteResponse);
  }

  const stats = deleteResponse.stats;
  const messages: MessageEnvelope[] = [];
  async.eachOf(
    ids,
    (id, _, done) => {
      _getMessage(redisClient, id, (err, msg) => {
        if (err) {
          if (err instanceof MessageNotFoundError) {
            stats.notFound += 1;
            stats.processed += 1;
            return done();
          }
          return done(err);
        }
        if (msg) messages.push(msg);
        done();
      });
    },
    (err?: Error | null) => {
      if (err) return cb(err);

      if (!messages.length) {
        return cb(null, deleteResponse);
      }

      const messagesByQueueAndGroup: Record<
        string, // queue ID
        Record<
          string, // consumer group ID
          { queue: IQueueParams; messages: MessageEnvelope[] }
        >
      > = {};
      messages.reduce((acc, msg) => {
        const queue = msg.getDestinationQueue();
        const queueId = `${queue.ns}:${queue.name}`;
        if (!acc[queueId]) {
          acc[queueId] = {};
        }
        const consumerGroupId = msg.getConsumerGroupId() ?? '_';
        if (!acc[queueId][consumerGroupId]) {
          acc[queueId][consumerGroupId] = {
            queue,
            messages: [],
          };
        }
        acc[queueId][consumerGroupId].messages.push(msg);
        return acc;
      }, messagesByQueueAndGroup);

      async.eachIn(
        messagesByQueueAndGroup,
        (groups, _, done) => {
          async.eachIn(
            groups,
            (item, groupId, done) => {
              const { queue, messages: batchMessages } = item;
              const consumerGroupId = groupId === '_' ? null : groupId;
              const {
                keyQueueProperties,
                keyQueueMessages,
                keyQueuePending,
                keyQueuePriorityPending,
                keyQueueScheduled,
                keyQueueAcknowledged,
                keyQueueDL,
                keyQueueDelayed,
                keyQueueRequeued,
              } = redisKeys.getQueueKeys(queue, consumerGroupId);

              const staticKeys = [
                keyQueueProperties,
                keyQueueMessages,
                keyQueuePending,
                keyQueuePriorityPending,
                keyQueueScheduled,
                keyQueueAcknowledged,
                keyQueueDL,
                keyQueueDelayed,
                keyQueueRequeued,
              ];

              const staticArgs: (string | number)[] = [
                EQueueProperty.QUEUE_TYPE,
                EQueueProperty.MESSAGES_COUNT,
                EQueueProperty.ACKNOWLEDGED_MESSAGES_COUNT,
                EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
                EQueueProperty.PENDING_MESSAGES_COUNT,
                EQueueProperty.SCHEDULED_MESSAGES_COUNT,
                EQueueProperty.DELAYED_MESSAGES_COUNT,
                EQueueProperty.REQUEUED_MESSAGES_COUNT,
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
              ];

              const dynamicKeys = batchMessages.map(
                (msg) => redisKeys.getMessageKeys(msg.getId()).keyMessage,
              );
              const dynamicArgs = batchMessages.map((msg) => msg.getId());

              const keys = [...staticKeys, ...dynamicKeys];
              const argv = [...staticArgs, ...dynamicArgs];

              redisClient.runScript(
                ELuaScriptName.DELETE_MESSAGE,
                keys,
                argv,
                (err, reply) => {
                  if (err) return done(err);
                  // type-coverage:ignore-next-line
                  if (!Array.isArray(reply) || reply.length !== 4) {
                    return done(new CallbackInvalidReplyError());
                  }
                  // type-coverage:ignore-next-line
                  const [processed, success, notFound, inProcess] = reply as [
                    number,
                    number,
                    number,
                    number,
                  ];
                  stats.processed += processed;
                  stats.success += success;
                  stats.notFound += notFound;
                  stats.inProcess += inProcess;
                  done();
                },
              );
            },
            done,
          );
        },
        (err) => {
          if (err) return cb(err);
          deleteResponse.status =
            (stats.processed === stats.success && 'OK') ||
            (stats.success && 'PARTIAL_SUCCESS') ||
            'MESSAGE_NOT_DELETED';
          cb(null, deleteResponse);
        },
      );
    },
  );
}
