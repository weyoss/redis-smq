/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger } from 'redis-smq-common';
import {
  EQueueOperationalState,
  EQueueProperty,
  IQueueParsedParams,
} from '../../../../queue-manager/index.js';
import {
  EMessageUnacknowledgementAction,
  TUnacknowledgementResult,
  TUnacknowledgementResolution,
  TUnacknowledgementBatch,
} from '../types/index.js';
import { redisKeys } from '../../../../common/redis/redis-keys/redis-keys.js';
import { ERedisScriptName } from '../../../../common/redis/scripts.js';
import {
  InvalidQueueStateError,
  QueueLockedError,
  QueueNotFoundError,
  QueueStoppedError,
  UnexpectedScriptReplyError,
} from '../../../../errors/index.js';
import { Configuration } from '../../../../config-manager/configuration.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../../message/index.js';
import { withSharedPoolConnection } from '../../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { IMessageUnacknowledgementRecord } from '../types/index.js';

export function _executeUnacknowledgementScript(
  queue: IQueueParsedParams,
  messages: TUnacknowledgementBatch['messages'],
  consumerId: string,
  logger: ILogger,
  cb: ICallback<TUnacknowledgementResult>,
): void {
  const { queueParams, groupId } = queue;
  withSharedPoolConnection((client, done) => {
    const { keyQueueRequeued, keyQueueDeadLetter, keyQueueProperties } =
      redisKeys.getQueueKeys(queueParams.ns, queueParams.name, groupId);
    const { enabled, expire, queueSize } =
      Configuration.getConfig().messageAudit.deadLetteredMessages;

    // Get history tracking configuration
    const historyConfig =
      Configuration.getConfig().messageAudit.unacknowledgementHistory;
    const maxHistorySize = historyConfig.maxSize;
    const historyEnabled = historyConfig.enabled;

    const staticKeys = [
      keyQueueRequeued,
      keyQueueDeadLetter,
      keyQueueProperties,
    ];
    const staticArgs = [
      EMessageUnacknowledgementAction.DELAY,
      EMessageUnacknowledgementAction.REQUEUE,
      Number(enabled),
      expire,
      queueSize * -1,
      EMessageProperty.STATUS,
      EQueueProperty.PROCESSING_MESSAGES_COUNT,
      EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
      EQueueProperty.REQUEUED_MESSAGES_COUNT,
      EMessagePropertyStatus.UNACK_REQUEUING,
      EMessagePropertyStatus.DEAD_LETTERED,
      EMessageProperty.DEAD_LETTERED_AT,
      EMessageProperty.UNACKNOWLEDGED_AT,
      EMessageProperty.LAST_UNACKNOWLEDGED_AT,
      EMessageProperty.EXPIRED,
      EQueueProperty.OPERATIONAL_STATE,
      EQueueOperationalState.ACTIVE,
      EQueueOperationalState.PAUSED,
      EQueueOperationalState.STOPPED,
      EQueueOperationalState.LOCKED,
      maxHistorySize,
    ];

    const dynamicKeys: string[] = [];
    const dynamicArgs: (string | number)[] = [];
    const actions = new Map<string, TUnacknowledgementResolution>();

    for (const msg of messages) {
      const messageId = msg.message.getId();
      const { keyMessage, keyMessageUnacknowledgementHistory } =
        redisKeys.getMessageKeys(messageId);
      const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
        queueParams,
        consumerId,
      );
      const state = msg.message.getMessageState();
      const now = Date.now();

      const unacknowledgedAt = state?.getUnacknowledgedAt() ?? now;
      const lastUnacknowledgedAt = now;

      // Add history key to dynamic keys
      dynamicKeys.push(
        keyQueueProcessing,
        keyMessage,
        keyMessageUnacknowledgementHistory,
      );

      let historyRecordStr = '';
      if (historyEnabled) {
        const historyRecord: IMessageUnacknowledgementRecord = {
          messageId,
          cause: msg.resolution.cause,
          action: msg.resolution.action,
          timestamp: lastUnacknowledgedAt,
          retryCount: state.getAttempts(),
          queue,
          consumerId,
          deadLetterCause:
            msg.resolution.action ===
            EMessageUnacknowledgementAction.DEAD_LETTER
              ? msg.resolution.deadLetterCause
              : undefined,
        };
        historyRecordStr = JSON.stringify(historyRecord);
      }

      dynamicArgs.push(
        messageId,
        msg.resolution.action,
        state?.getDeadLetteredAt() ?? '',
        Number(state?.getExpired() ?? false),
        unacknowledgedAt,
        lastUnacknowledgedAt,
        historyRecordStr,
      );

      actions.set(messageId, msg.resolution);
    }

    logger.debug(
      `Executing script for queue ${queueParams.ns}:${queueParams.name} with ${messages.length} messages`,
    );

    client.runScript(
      ERedisScriptName.UNACKNOWLEDGE_MESSAGE,
      [...staticKeys, ...dynamicKeys],
      [...staticArgs, ...dynamicArgs],
      (err, reply) => {
        if (err) {
          logger.error(`Script execution failed: ${err.message}`);
          return done(err);
        }

        if (typeof reply === 'string') {
          if (reply === 'QUEUE_NOT_FOUND') {
            return done(
              new QueueNotFoundError({
                metadata: {
                  queue: queueParams,
                },
              }),
            );
          }

          if (reply === 'QUEUE_STOPPED') {
            return done(
              new QueueStoppedError({
                metadata: {
                  queue: queueParams,
                },
              }),
            );
          }

          if (reply === 'QUEUE_LOCKED') {
            return done(
              new QueueLockedError({
                metadata: {
                  queue: queueParams,
                },
              }),
            );
          }

          if (reply === 'QUEUE_INVALID_STATE') {
            return done(
              new InvalidQueueStateError({
                metadata: {
                  queue: queueParams,
                },
              }),
            );
          }

          if (reply === 'INVALID_ARGS_ERROR') {
            return done(
              new UnexpectedScriptReplyError({
                message:
                  'Invalid arguments error in UNACKNOWLEDGE_MESSAGE script',
                metadata: {
                  reply,
                },
              }),
            );
          }

          return done(
            new UnexpectedScriptReplyError({
              metadata: { reply },
            }),
          );
        }

        const count = Number(reply);
        if (isNaN(count)) {
          return done(
            new UnexpectedScriptReplyError({
              metadata: { reply },
            }),
          );
        }

        if (count !== messages.length) {
          logger.warn(
            `Script processed ${count}/${messages.length} messages for queue ${queueParams.ns}:${queueParams.name}`,
          );
        }

        logger.debug(
          `Successfully processed ${count} messages for queue ${queueParams.ns}:${queueParams.name}`,
        );

        done(null, Object.fromEntries(actions));
      },
    );
  }, cb);
}
