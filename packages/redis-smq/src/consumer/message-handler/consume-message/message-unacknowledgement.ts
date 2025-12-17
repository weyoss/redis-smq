/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, createLogger, ICallback, IRedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../message/index.js';
import { _getMessages } from '../../../message-manager/_/_get-message.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { EQueueProperty, IQueueParams } from '../../../queue-manager/index.js';
import { _getConsumerQueues } from '../../_/_get-consumer-queues.js';
import {
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementDeadLetterReason,
  EMessageUnacknowledgementReason,
  TMessageUnacknowledgementAction,
  TMessageUnacknowledgementStatus,
} from './types/index.js';
import { MessageHandlerError } from '../../../errors/index.js';
import { withSharedPoolConnection } from '../../../common/redis/redis-connection-pool/with-shared-pool-connection.js';

type TScriptArgs = {
  keys: string[];
  args: (string | number)[];
  actions: Map<MessageEnvelope, TMessageUnacknowledgementAction>;
};

type TUnacknowledgementArgs = {
  action: TMessageUnacknowledgementAction | null;
  keys: string[];
  args: (string | number)[];
};

const UNACK_STATIC_KEYS = (queue: IQueueParams): string[] => {
  const {
    keyQueueRequeued,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueueConsumers,
    keyQueueProperties,
  } = redisKeys.getQueueKeys(queue.ns, queue.name, null);
  return [
    keyQueueRequeued,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueueConsumers,
    keyQueueProperties,
  ];
};

const UNACK_STATIC_ARGS = (): (string | number)[] => {
  const { enabled, expire, queueSize } =
    Configuration.getConfig().messageAudit.deadLetteredMessages;
  return [
    EMessageUnacknowledgementAction.DELAY,
    EMessageUnacknowledgementAction.REQUEUE,
    EMessageUnacknowledgementAction.DEAD_LETTER,
    Number(enabled),
    expire,
    queueSize * -1,
    EMessageProperty.STATUS,
    EMessageUnacknowledgementReason.OFFLINE_CONSUMER,
    EMessageUnacknowledgementReason.OFFLINE_MESSAGE_HANDLER,
    EQueueProperty.PROCESSING_MESSAGES_COUNT,
    EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
    EQueueProperty.REQUEUED_MESSAGES_COUNT,
    EMessagePropertyStatus.UNACK_REQUEUING,
    EMessagePropertyStatus.DEAD_LETTERED,
    EMessageProperty.DEAD_LETTERED_AT,
    EMessageProperty.UNACKNOWLEDGED_AT,
    EMessageProperty.LAST_UNACKNOWLEDGED_AT,
    EMessageProperty.EXPIRED,
  ];
};

/**
 * Handles the unacknowledgement of messages in the message queue system.
 *
 * This class is responsible for determining what happens to messages that
 * were not successfully processed, including:
 * - Moving messages to dead letter queues
 * - Requeuing messages for retry
 * - Delaying messages before retry
 */
export class MessageUnacknowledgement {
  protected readonly logger;

  /**
   * Creates a new MessageUnacknowledgement instance.
   */
  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
  }

  /**
   * Unacknowledges a specific message.
   *
   * @param consumerId - The ID of the consumer
   * @param msg - The message envelope
   * @param unacknowledgementReason - The reason for unacknowledgement
   * @param cb - Callback function
   */
  public unacknowledgeMessage(
    consumerId: string,
    msg: MessageEnvelope,
    unacknowledgementReason: EMessageUnacknowledgementReason,
    cb: ICallback<TMessageUnacknowledgementStatus>,
  ): void {
    withSharedPoolConnection((client, done) => {
      const queue = msg.getDestinationQueue();
      this.executeUnacknowledgementScript(
        client,
        consumerId,
        queue,
        [msg],
        unacknowledgementReason,
        done,
      );
    }, cb);
  }

  /**
   * Unacknowledges all messages currently being processed by a consumer.
   *
   * @param consumerId - The ID of the consumer
   * @param queues - Optional list of queues to check, or null to check all queues for the consumer
   * @param unackReason - The reason for unacknowledgement
   * @param cb - Callback function
   */
  public unacknowledgeMessagesInProcess(
    consumerId: string,
    queues: IQueueParams[] | null,
    unackReason: EMessageUnacknowledgementReason,
    cb: ICallback<TMessageUnacknowledgementStatus>,
  ): void {
    withSharedPoolConnection((client, done) => {
      async.waterfall(
        [
          // Step 1: Get the list of queues for this consumer
          (next: ICallback<IQueueParams[]>) => {
            if (queues) next(null, queues);
            else _getConsumerQueues(client, consumerId, next);
          },
          // Step 2: Process each queue and collect the results
          (
            queues: IQueueParams[],
            next: ICallback<TMessageUnacknowledgementStatus[]>,
          ) => {
            async.map(
              queues,
              (queue, finished) =>
                this.unacknowledgeMessagesFromProcessingQueue(
                  client,
                  consumerId,
                  queue,
                  unackReason,
                  finished,
                ),
              100,
              next,
            );
          },
          // Step 3: Combine the results from all queues into a single status object
          (
            statuses: TMessageUnacknowledgementStatus[],
            next: ICallback<TMessageUnacknowledgementStatus>,
          ) => {
            const combinedStatus: TMessageUnacknowledgementStatus =
              Object.assign({}, ...statuses);
            next(null, combinedStatus);
          },
        ],
        done,
      );
    }, cb);
  }

  /**
   * Determines the appropriate action to take for an unacknowledged message.
   *
   * @param message - The message envelope
   * @param unacknowledgedReason - The reason for unacknowledgement
   * @returns The action to take for the unacknowledged message
   */
  protected getMessageUnacknowledgementAction(
    message: MessageEnvelope,
    unacknowledgedReason: EMessageUnacknowledgementReason,
  ): TMessageUnacknowledgementAction {
    // Check if message TTL has expired
    if (unacknowledgedReason === EMessageUnacknowledgementReason.TTL_EXPIRED) {
      return {
        action: EMessageUnacknowledgementAction.DEAD_LETTER,
        deadLetterReason: EMessageUnacknowledgementDeadLetterReason.TTL_EXPIRED,
      };
    }

    // Handle periodic messages
    if (message.isPeriodic()) {
      // Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such
      // messages are periodically scheduled for delivery.
      return {
        action: EMessageUnacknowledgementAction.DEAD_LETTER,
        deadLetterReason:
          EMessageUnacknowledgementDeadLetterReason.PERIODIC_MESSAGE,
      };
    }

    // Check if retry threshold has been exceeded
    if (message.hasRetryThresholdExceeded()) {
      return {
        action: EMessageUnacknowledgementAction.DEAD_LETTER,
        deadLetterReason:
          EMessageUnacknowledgementDeadLetterReason.RETRY_THRESHOLD_EXCEEDED,
      };
    }

    // Determine if message should be delayed before retry
    const delay = message.producibleMessage.getRetryDelay();
    return delay
      ? { action: EMessageUnacknowledgementAction.DELAY }
      : { action: EMessageUnacknowledgementAction.REQUEUE };
  }

  protected unacknowledgeMessagesFromProcessingQueue(
    client: IRedisClient,
    consumerId: string,
    queue: IQueueParams,
    unacknowledgementReason: EMessageUnacknowledgementReason,
    cb: ICallback<TMessageUnacknowledgementStatus>,
  ): void {
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue,
      consumerId,
    );
    async.waterfall(
      [
        (next: ICallback<string[]>) => {
          client.lrange(keyQueueProcessing, 0, -1, (err, reply) => {
            if (err) next(err);
            else next(null, reply ?? []);
          });
        },
        (messageIds: string[], next: ICallback<MessageEnvelope[]>) => {
          if (!messageIds.length) next(null, []);
          else _getMessages(client, messageIds, next);
        },
        (
          messages: MessageEnvelope[],
          next: ICallback<TMessageUnacknowledgementStatus>,
        ) => {
          this.executeUnacknowledgementScript(
            client,
            consumerId,
            queue,
            messages,
            unacknowledgementReason,
            next,
          );
        },
      ],
      cb,
    );
  }

  protected prepareUnacknowledgementArgs(
    consumerId: string,
    queue: IQueueParams,
    msg: MessageEnvelope | null,
    unacknowledgementReason: EMessageUnacknowledgementReason,
  ): TUnacknowledgementArgs {
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue,
      consumerId,
    );
    const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);

    const msgId = msg?.getId() ?? '';
    const keyMessage = msg ? redisKeys.getMessageKeys(msgId).keyMessage : '';

    const unackAction: TMessageUnacknowledgementAction | null = msg
      ? this.getMessageUnacknowledgementAction(msg, unacknowledgementReason)
      : null;

    const ts = Date.now();
    const messageState = msg?.getMessageState();

    const keys = [keyQueueProcessing, keyMessage, keyConsumerQueues];
    const args: (string | number)[] = [
      JSON.stringify(queue),
      consumerId,
      msgId,
      unackAction?.action ?? -1,
      unacknowledgementReason,
      messageState?.getDeadLetteredAt() ?? '',
      Number(messageState?.getExpired() ?? false),
      messageState?.getUnacknowledgedAt() ?? ts,
      ts, // lastUnacknowledgedAt
    ];

    return {
      action: unackAction,
      keys,
      args,
    };
  }

  protected buildScriptArgs(
    consumerId: string,
    queue: IQueueParams,
    messages: MessageEnvelope[],
    unacknowledgementReason: EMessageUnacknowledgementReason,
  ): TScriptArgs {
    const staticKeys = UNACK_STATIC_KEYS(queue);
    const staticArgs = UNACK_STATIC_ARGS();

    const dynamicKeys: string[] = [];
    const dynamicArgs: (string | number)[] = [];
    const actions = new Map<MessageEnvelope, TMessageUnacknowledgementAction>();

    const messagesOrNull: (MessageEnvelope | null)[] = messages.length
      ? messages
      : [null];

    for (const msg of messagesOrNull) {
      const payload = this.prepareUnacknowledgementArgs(
        consumerId,
        queue,
        msg,
        unacknowledgementReason,
      );
      if (msg && payload.action) {
        actions.set(msg, payload.action);
      }
      dynamicKeys.push(...payload.keys);
      dynamicArgs.push(...payload.args);
    }

    return {
      keys: [...staticKeys, ...dynamicKeys],
      args: [...staticArgs, ...dynamicArgs],
      actions,
    };
  }

  protected executeUnacknowledgementScript(
    client: IRedisClient,
    consumerId: string,
    queue: IQueueParams,
    messages: MessageEnvelope[],
    unacknowledgementReason: EMessageUnacknowledgementReason,
    cb: ICallback<TMessageUnacknowledgementStatus>,
  ): void {
    const { keys, args, actions } = this.buildScriptArgs(
      consumerId,
      queue,
      messages,
      unacknowledgementReason,
    );
    client.runScript(
      ELuaScriptName.UNACKNOWLEDGE_MESSAGE,
      keys,
      args,
      (err, reply) => {
        if (err) return cb(err);
        const processedCount = Number(reply);
        if (isNaN(processedCount)) {
          return cb(
            new MessageHandlerError(`Unexpected reply type received: ${reply}`),
          );
        }
        const expectedCount = messages.length;
        if (processedCount !== expectedCount) {
          return cb(
            new MessageHandlerError(
              `Script reported processing ${processedCount} entries, but expected ${expectedCount}`,
            ),
          );
        }
        const status: TMessageUnacknowledgementStatus = Object.fromEntries(
          Array.from(actions.entries()).map(([msg, action]) => [
            msg.getId(),
            action,
          ]),
        );
        cb(null, status);
      },
    );
  }
}
