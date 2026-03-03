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
  IQueueParams,
} from '../../../../queue-manager/index.js';
import {
  EUnacknowledgementAction,
  TUnacknowledgementResult,
  TUnacknowledgementResolution,
  TUnacknowledgementBatch,
} from '../types/index.js';
import { redisKeys } from '../../../../common/redis/redis-keys/redis-keys.js';
import { ERedisScriptName } from '../../../../common/redis/scripts.js';
import { UnexpectedScriptReplyError } from '../../../../errors/index.js';
import { Configuration } from '../../../../config/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../../message/index.js';
import { withSharedPoolConnection } from '../../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';

export function _executeUnacknowledgementScript(
  queue: IQueueParams,
  messages: TUnacknowledgementBatch['messages'],
  consumerId: string,
  logger: ILogger,
  cb: ICallback<TUnacknowledgementResult>,
): void {
  withSharedPoolConnection((client, done) => {
    const { keyQueueRequeued, keyQueueDL, keyQueueProperties } =
      redisKeys.getQueueKeys(queue.ns, queue.name, null);
    const { enabled, expire, queueSize } =
      Configuration.getConfig().messageAudit.deadLetteredMessages;

    const staticKeys = [keyQueueRequeued, keyQueueDL, keyQueueProperties];
    const staticArgs = [
      EUnacknowledgementAction.DELAY,
      EUnacknowledgementAction.REQUEUE,
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
    ];

    const dynamicKeys: string[] = [];
    const dynamicArgs: (string | number)[] = [];
    const actions = new Map<string, TUnacknowledgementResolution>();

    for (const msg of messages) {
      const messageId = msg.message.getId();
      const { keyMessage } = redisKeys.getMessageKeys(messageId);
      const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
        queue,
        consumerId,
      );
      const state = msg.message.getMessageState();
      const now = Date.now();

      dynamicKeys.push(keyQueueProcessing, keyMessage);
      dynamicArgs.push(
        messageId,
        msg.resolution.action,
        state?.getDeadLetteredAt() ?? '',
        Number(state?.getExpired() ?? false),
        state?.getUnacknowledgedAt() ?? now,
        now,
      );

      actions.set(messageId, msg.resolution);
    }

    logger.debug(
      `Executing script for queue ${queue.ns}:${queue.name} with ${messages.length} messages`,
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
          logger.warn(`Script returned queue state: ${reply}`);
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
            `Script processed ${count}/${messages.length} messages for queue ${queue.ns}:${queue.name}`,
          );
        }

        logger.debug(
          `Successfully processed ${count} messages for queue ${queue.ns}:${queue.name}`,
        );

        done(null, Object.fromEntries(actions));
      },
    );
  }, cb);
}
