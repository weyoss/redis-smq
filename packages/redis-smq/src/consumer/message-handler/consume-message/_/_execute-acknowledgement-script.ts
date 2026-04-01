/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../../../message/message-envelope.js';
import { ICallback } from 'redis-smq-common';
import { Configuration } from '../../../../config-manager/configuration.js';
import { ERedisScriptName } from '../../../../common/redis/scripts.js';
import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParsedParams,
} from '../../../../queue-manager/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../../message/index.js';
import { withSharedPoolConnection } from '../../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import {
  InvalidQueueStateError,
  QueueLockedError,
  QueueNotFoundError,
  QueueStoppedError,
  UnexpectedScriptReplyError,
} from '../../../../errors/index.js';
import { redisKeys } from '../../../../common/redis/redis-keys/redis-keys.js';

function isValidAcknowledgementResult(
  reply: unknown,
): reply is TAcknowledgementResult {
  return (
    Array.isArray(reply) && reply.find((i) => typeof i !== 'number') == null
  );
}

type TAcknowledgementResult = (0 | 1)[];

export function _executeAcknowledgementScript(
  queue: IQueueParsedParams,
  consumerId: string,
  messages: MessageEnvelope[],
  cb: ICallback<TAcknowledgementResult>,
): void {
  withSharedPoolConnection((client, done) => {
    const { enabled, queueSize, expire } =
      Configuration.getConfig().messageAudit.acknowledgedMessages;

    const { keyQueueAcknowledged, keyQueueProperties } = redisKeys.getQueueKeys(
      queue.queueParams.ns,
      queue.queueParams.name,
      queue.groupId,
    );

    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue.queueParams,
      consumerId,
    );
    const messageKeys: string[] = [];
    const messageIds: string[] = [];
    messages.forEach((m) => {
      const id = m.getId();
      messageIds.push(id);
      const { keyMessage } = redisKeys.getMessageKeys(id);
      messageKeys.push(keyMessage);
    });

    const keys = [
      keyQueueProcessing,
      keyQueueAcknowledged,
      keyQueueProperties,
      ...messageKeys,
    ];

    const argv = [
      Number(enabled), // ARGV[1]: storeMessages
      expire, // ARGV[2]: expireStoredMessages
      queueSize * -1, // ARGV[3]: storedMessagesSize
      Date.now(), // ARGV[4]: messageAcknowledgedAt
      EQueueProperty.OPERATIONAL_STATE, // ARGV[5]: state field
      EQueueOperationalState.ACTIVE, // ARGV[6]: active state
      EQueueOperationalState.PAUSED, // ARGV[7]: paused state
      EQueueOperationalState.STOPPED, // ARGV[8]: stopped state
      EQueueOperationalState.LOCKED, // ARGV[9]: locked state
      EMessageProperty.STATUS, // ARGV[10]: status field
      EMessagePropertyStatus.ACKNOWLEDGED, // ARGV[11]: acknowledged status
      EMessageProperty.ACKNOWLEDGED_AT, // ARGV[12]: acknowledged at field
      EQueueProperty.ACKNOWLEDGED_MESSAGES_COUNT, // ARGV[13]: acknowledged count field
      EQueueProperty.PROCESSING_MESSAGES_COUNT, // ARGV[14]: processing count field
      ...messageIds, // ARGV[15+]: message IDs
    ];

    client.runScript(
      ERedisScriptName.ACKNOWLEDGE_MESSAGE,
      keys,
      argv,
      (err, reply) => {
        if (!err && isValidAcknowledgementResult(reply)) {
          return done(null, reply);
        }

        if (err) return done(err);

        if (typeof reply === 'string') {
          if (reply === 'QUEUE_STOPPED') {
            return done(
              new QueueStoppedError({
                metadata: { queue: queue.queueParams },
              }),
            );
          }
          if (reply === 'QUEUE_LOCKED') {
            return done(
              new QueueLockedError({
                metadata: { queue: queue.queueParams },
              }),
            );
          }
          if (reply === 'QUEUE_NOT_FOUND') {
            return done(
              new QueueNotFoundError({
                metadata: { queue: queue.queueParams },
              }),
            );
          }
          if (reply === 'QUEUE_INVALID_STATE') {
            return done(
              new InvalidQueueStateError({
                metadata: { queue: queue.queueParams },
              }),
            );
          }
        }

        done(
          new UnexpectedScriptReplyError({
            metadata: {
              reply,
            },
          }),
        );
      },
    );
  }, cb);
}
