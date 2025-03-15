/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, IRedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../../config/index.js';
import { _getMessage } from '../../../message/_/_get-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../message/index.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { IQueueParams } from '../../../queue/index.js';
import { consumerQueues } from '../../consumer-queues.js';
import { ConsumerError } from '../../errors/index.js';
import {
  EMessageUnknowledgmentAction,
  EMessageUnknowledgmentDeadLetterReason,
  EMessageUnknowledgmentReason,
  TMessageUnacknowledgmentStatus,
  TMessageUnknowledgmentAction,
} from './types/index.js';

function getMessageUnknowledgementAction(
  message: MessageEnvelope,
  unacknowledgedReason: EMessageUnknowledgmentReason,
): TMessageUnknowledgmentAction {
  if (
    unacknowledgedReason === EMessageUnknowledgmentReason.TTL_EXPIRED ||
    message.getSetExpired()
  ) {
    return {
      action: EMessageUnknowledgmentAction.DEAD_LETTER,
      deadLetterReason: EMessageUnknowledgmentDeadLetterReason.TTL_EXPIRED,
    };
  }
  if (message.isPeriodic()) {
    // Only non-periodic message are re-queued. Failure of periodic message is ignored since such
    // message are periodically scheduled for delivery.
    return {
      action: EMessageUnknowledgmentAction.DEAD_LETTER,
      deadLetterReason: EMessageUnknowledgmentDeadLetterReason.PERIODIC_MESSAGE,
    };
  }
  if (message.hasRetryThresholdExceeded()) {
    return {
      action: EMessageUnknowledgmentAction.DEAD_LETTER,
      deadLetterReason:
        EMessageUnknowledgmentDeadLetterReason.RETRY_THRESHOLD_EXCEEDED,
    };
  }
  const delay = message.producibleMessage.getRetryDelay();
  return delay
    ? { action: EMessageUnknowledgmentAction.DELAY }
    : { action: EMessageUnknowledgmentAction.REQUEUE };
}

function unknowledgeProcessingQueueMessage(
  redisClient: IRedisClient,
  consumerId: string,
  queue: IQueueParams,
  unknowledgmentReason: EMessageUnknowledgmentReason,
  keys: string[],
  args: (string | number)[],
  unacknowledgementStatus: TMessageUnacknowledgmentStatus,
  done: ICallback<void>,
): void {
  args.push(JSON.stringify(queue), consumerId);
  const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);
  const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
    queue,
    consumerId,
  );
  const {
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueueConsumers,
    keyQueueProperties,
    keyQueueDelayed,
    keyQueueRequeued,
  } = redisKeys.getQueueKeys(queue, null);

  keys.push(
    keyQueueProcessing,
    keyQueueDelayed,
    keyQueueRequeued,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueueConsumers,
    keyConsumerQueues,
    keyQueueProperties,
  );

  processingQueue.fetchProcessingQueueMessage(
    redisClient,
    keyQueueProcessing,
    (err, message) => {
      if (err) return done(err);

      if (!message) {
        keys.push('');
        args.push('', '', '', unknowledgmentReason, '');
        return done();
      }

      const messageId = message.getId();
      const { keyMessage } = redisKeys.getMessageKeys(messageId);
      keys.push(keyMessage);
      args.push(messageId);

      const unknowledgementAction = getMessageUnknowledgementAction(
        message,
        unknowledgmentReason,
      );
      const { action } = unknowledgementAction;

      const messageStatus =
        action === EMessageUnknowledgmentAction.DEAD_LETTER
          ? EMessagePropertyStatus.DEAD_LETTERED
          : action === EMessageUnknowledgmentAction.REQUEUE
            ? EMessagePropertyStatus.UNACK_REQUEUING
            : EMessagePropertyStatus.UNACK_DELAYING;

      args.push(
        action,
        action === EMessageUnknowledgmentAction.DEAD_LETTER
          ? unknowledgementAction.deadLetterReason
          : '',
        unknowledgmentReason,
        messageStatus,
      );

      unacknowledgementStatus[messageId] = unknowledgementAction;
      done();
    },
  );
}

export const processingQueue = {
  unknowledgeMessage(
    redisClient: IRedisClient,
    consumerId: string,
    queues: IQueueParams[] | null,
    logger: ILogger,
    unknowledgmentReason: EMessageUnknowledgmentReason,
    cb: ICallback<TMessageUnacknowledgmentStatus>,
  ): void {
    const { store, expire, queueSize } =
      Configuration.getSetConfig().messages.store.deadLettered;
    const keys: string[] = [];
    const args: (string | number)[] = [
      EMessageUnknowledgmentAction.DELAY,
      EMessageUnknowledgmentAction.REQUEUE,
      EMessageUnknowledgmentAction.DEAD_LETTER,
      Number(store),
      expire,
      queueSize * -1,
      EMessageProperty.STATUS,
      EMessageUnknowledgmentReason.OFFLINE_CONSUMER,
      EMessageUnknowledgmentReason.OFFLINE_MESSAGE_HANDLER,
    ];
    const messageHandlingStatus: TMessageUnacknowledgmentStatus = {};

    async.waterfall<IQueueParams[]>(
      [
        (next: ICallback<IQueueParams[]>) => {
          if (queues === null) {
            consumerQueues.getConsumerQueues(redisClient, consumerId, next);
          } else {
            next(null, queues);
          }
        },
        (queueParams: IQueueParams[], next: ICallback<void>) => {
          if (!queueParams.length) {
            return next();
          }
          async.eachOf(
            queueParams,
            (queue: IQueueParams, _: number, done: ICallback<void>) => {
              unknowledgeProcessingQueueMessage(
                redisClient,
                consumerId,
                queue,
                unknowledgmentReason,
                keys,
                args,
                messageHandlingStatus,
                done,
              );
            },
            next,
          );
        },
      ],
      (err) => {
        if (err) {
          return cb(err);
        }
        if (!keys.length) {
          return cb();
        }
        redisClient.runScript(
          ELuaScriptName.HANDLE_PROCESSING_QUEUE,
          keys,
          args,
          (err, reply) => {
            if (err) {
              return cb(err);
            }
            if (reply !== 'OK') {
              return cb(new ConsumerError(reply ? String(reply) : undefined));
            }
            Object.keys(messageHandlingStatus).forEach((messageId) => {
              const action =
                messageHandlingStatus[messageId].action ===
                EMessageUnknowledgmentAction.DEAD_LETTER
                  ? 'dead-lettered'
                  : 'unacknowledged';
              logger.debug(`Message ID ${messageId} has been ${action}.`);
            });
            cb(null, messageHandlingStatus);
          },
        );
      },
    );
  },

  fetchProcessingQueueMessage(
    redisClient: IRedisClient,
    keyQueueProcessing: string,
    cb: ICallback<MessageEnvelope>,
  ): void {
    redisClient.lrange(keyQueueProcessing, 0, 0, (err, range) => {
      if (err) {
        return cb(err);
      }
      if (range && range.length) {
        _getMessage(redisClient, range[0], cb);
      } else {
        cb();
      }
    });
  },

  getQueueProcessingQueues(
    redisClient: IRedisClient,
    queue: IQueueParams,
    cb: ICallback<Record<string, string>>,
  ): void {
    const { keyQueueProcessingQueues } = redisKeys.getQueueKeys(queue, null);
    redisClient.hgetall(keyQueueProcessingQueues, cb);
  },
};
