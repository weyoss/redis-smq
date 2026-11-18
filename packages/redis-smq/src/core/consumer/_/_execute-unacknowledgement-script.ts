/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger } from 'redis-smq-common';
import { keys } from '../../common/redis/keys/keys.js';
import { ERedisScriptName } from '../../common/scripts/registry.js';
import {
  InvalidQueueStateError,
  QueueLockedError,
  QueueNotFoundError,
  QueueStoppedError,
  UnexpectedScriptReplyError,
} from '../../errors/index.js';
import { Configuration } from '../../config-manager/configuration.js';
import { withShared } from '../../common/redis/connection-pool/with-shared.js';
import {
  EQueueOperationalState,
  IQueueParsedParams,
} from '../../../contracts/index.js';
import {
  TUnacknowledgementBatch,
  TUnacknowledgementResolution,
  TUnacknowledgementResult,
} from '../types/message-unacknowledgement.js';
import {
  EMessagePropertyStatus,
  EMessageUnacknowledgementAction,
  IMessageUnacknowledgementRecord,
} from '../../../contracts/index.js';
import { EQueueProperty } from '../../queue-manager/types/queue-property.js';
import { EMessageProperty } from '../../message/message-property.js';

export function _executeUnacknowledgementScript(
  queue: IQueueParsedParams,
  messages: TUnacknowledgementBatch['messages'],
  consumerId: string,
  logger: ILogger,
  cb: ICallback<TUnacknowledgementResult>,
): void {
  const { queueParams, groupId } = queue;
  withShared((client, done) => {
    const { keyQueueRequeued, keyQueueDeadLetter, keyQueueProperties } =
      keys.getQueueKeys(queueParams.ns, queueParams.name, groupId);
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
    // Parallel array: same order as `messages`, so `results[i]`
    // corresponds to `orderedMessageIds[i]`.
    const orderedMessageIds: string[] = [];

    for (const msg of messages) {
      const messageId = msg.message.getId();
      const { keyMessage, keyMessageUnacknowledgementHistory } =
        keys.getMessageKeys(messageId);
      const { keyQueueProcessing } = keys.getQueueConsumerKeys(
        queueParams.ns,
        queueParams.name,
        consumerId,
      );
      const state = msg.message.getMessageState();
      const now = Date.now();

      const unacknowledgedAt = state?.getUnacknowledgedAt() ?? now;
      const lastUnacknowledgedAt = now;
      const deadLetteredAt =
        msg.resolution.action === EMessageUnacknowledgementAction.DEAD_LETTER
          ? now
          : '';

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
        deadLetteredAt,
        Number(state?.getExpired() ?? false),
        unacknowledgedAt,
        lastUnacknowledgedAt,
        historyRecordStr,
      );

      actions.set(messageId, msg.resolution);
      orderedMessageIds.push(messageId);
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

        // Success path: the script now returns a per-message results
        // array — one element per input message, in input order, where
        // 1 means "message was in the processing queue and was
        // processed" and 0 means "message was not in the processing
        // queue — already handled elsewhere, skip it".
        //
        // ioredis may hand back `null` for an empty Lua table; normalize.
        const results: unknown = reply ?? [];

        if (!Array.isArray(results)) {
          return done(
            new UnexpectedScriptReplyError({
              metadata: { reply: results },
            }),
          );
        }

        if (results.length !== messages.length) {
          return done(
            new UnexpectedScriptReplyError({
              message:
                `UNACKNOWLEDGE_MESSAGE result length (${results.length}) ` +
                `does not match message count (${messages.length})`,
              metadata: {
                reply: results,
              },
            }),
          );
        }

        // Filter the `actions` map to only the messages the script
        // actually processed. Entries with result 0 were already
        // removed from the processing queue by a peer (e.g. a
        // ReapConsumers cycle) — including them here would produce
        // phantom unack events downstream, since
        // `AcknowledgementPipeline.emitUnacknowledgementEvents`
        // iterates the returned map and emits one event per entry.
        const successfulActions: TUnacknowledgementResult = {};
        let processedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < results.length; i += 1) {
          if (results[i] === 1) {
            const messageId = orderedMessageIds[i];
            const resolution = actions.get(messageId);
            if (resolution) {
              successfulActions[messageId] = resolution;
              processedCount += 1;
            }
          } else {
            skippedCount += 1;
          }
        }

        if (skippedCount > 0) {
          logger.warn(
            `Script processed ${processedCount}/${messages.length} messages ` +
              `for queue ${queueParams.ns}:${queueParams.name} — ` +
              `${skippedCount} were already removed by a peer (skipped)`,
          );
        }

        logger.debug(
          `Successfully processed ${processedCount} messages ` +
            `for queue ${queueParams.ns}:${queueParams.name}`,
        );

        done(null, successfulActions);
      },
    );
  }, cb);
}
