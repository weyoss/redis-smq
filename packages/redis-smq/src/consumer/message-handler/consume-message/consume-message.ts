/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { stat } from 'fs';
import path from 'path';
import {
  async,
  AsyncCallbackTimeoutError,
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  logger,
  PanicError,
  Runnable,
  WorkerCallable,
} from 'redis-smq-common';
import { TConsumerConsumeMessageEvent } from '../../../common/index.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  IMessageTransferable,
} from '../../../message/index.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { EQueueProperty, IQueueParsedParams } from '../../../queue/index.js';
import { Consumer } from '../../consumer.js';
import {
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementReason,
  TConsumerMessageHandler,
  TMessageUnacknowledgementStatus,
} from '../../types/index.js';
import {
  ConsumerMessageHandlerFileError,
  ConsumerMessageHandlerFilenameExtensionError,
} from '../errors/index.js';
import { MessageUnacknowledgement } from './message-unacknowledgement.js';
import { eventBusPublisher } from './event-bus-publisher.js';
import { EventBus } from '../../../event-bus/index.js';

export class ConsumeMessage extends Runnable<TConsumerConsumeMessageEvent> {
  protected logger;
  protected keyQueueProperties;
  protected keyQueueProcessing;
  protected keyQueueAcknowledged;
  protected queue;
  protected consumerId;
  protected messageHandler;
  protected messageHandlerId;
  protected redisClient;
  protected messageUnack;
  protected consumeMessageWorker: WorkerCallable<
    IMessageTransferable,
    void
  > | null = null;

  constructor(
    redisClient: RedisClient,
    consumer: Consumer,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    messageHandler: TConsumerMessageHandler,
    eventBus: EventBus | null,
  ) {
    super();
    this.queue = queue;
    this.consumerId = consumer.getId();
    this.messageHandler = messageHandler;
    this.messageHandlerId = messageHandlerId;
    this.redisClient = redisClient;
    this.messageUnack = new MessageUnacknowledgement(redisClient);
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );

    this.logger.debug(
      `Initializing ConsumeMessage for consumer ${this.consumerId}, queue ${JSON.stringify(this.queue)}, messageHandlerId ${this.messageHandlerId}`,
    );

    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      this.queue.queueParams,
      this.consumerId,
    );
    const { keyQueueProperties, keyQueueAcknowledged } = redisKeys.getQueueKeys(
      this.queue.queueParams,
      this.queue.groupId,
    );
    this.keyQueueProperties = keyQueueProperties;
    this.keyQueueAcknowledged = keyQueueAcknowledged;
    this.keyQueueProcessing = keyQueueProcessing;

    this.logger.debug(
      `Queue processing key: ${this.keyQueueProcessing}, acknowledged key: ${this.keyQueueAcknowledged}`,
    );

    if (eventBus) {
      this.logger.debug('Event bus provided, setting up event bus publisher');
      eventBusPublisher(this, eventBus, this.logger);
    } else {
      this.logger.debug(
        'No event bus provided, skipping event bus publisher setup',
      );
    }

    this.logger.info(
      `ConsumeMessage initialized for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected acknowledgeMessage(message: MessageEnvelope): void {
    const messageId = message.getId();
    this.logger.debug(`Acknowledging message ${messageId}`);

    const { store, queueSize, expire } =
      Configuration.getSetConfig().messages.store.acknowledged;
    const { keyMessage } = redisKeys.getMessageKeys(messageId);

    this.logger.debug(
      `Message key: ${keyMessage}, store: ${store}, queueSize: ${queueSize}, expire: ${expire}`,
    );

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error(`Failed to get Redis client: ${redisClient.message}`);
      this.handleError(redisClient);
      return void 0;
    }

    const argv: (string | number)[] = [
      messageId,
      EMessageProperty.STATUS,
      EMessagePropertyStatus.ACKNOWLEDGED,
      EMessageProperty.ACKNOWLEDGED_AT,
      EQueueProperty.ACKNOWLEDGED_MESSAGES_COUNT,
      EQueueProperty.PROCESSING_MESSAGES_COUNT,
      Number(store),
      expire,
      queueSize * -1,
      Date.now(),
    ];

    this.logger.debug(
      `Running ACKNOWLEDGE_MESSAGE script for message ${messageId}`,
    );
    redisClient.runScript(
      ELuaScriptName.ACKNOWLEDGE_MESSAGE,
      [
        this.keyQueueProcessing,
        this.keyQueueAcknowledged,
        this.keyQueueProperties,
        keyMessage,
      ],
      argv,
      (err, reply) => {
        if (err) {
          this.logger.error(
            `Failed to acknowledge message ${messageId}: ${err.message}`,
          );
          return this.handleError(err);
        }
        if (reply === 1) {
          this.logger.info(`Message ${messageId} acknowledged successfully`);
          this.emit(
            'consumer.consumeMessage.messageAcknowledged',
            messageId,
            this.queue,
            this.messageHandlerId,
            this.consumerId,
          );
          this.logger.debug(
            `Emitted consumer.consumeMessage.messageAcknowledged event for message ${messageId}`,
          );
          return;
        }
        if (reply === 0) {
          // This case should never happen
          return this.handleError(
            new PanicError(
              `Message ${messageId} could not be acknowledged. It was not found in the processing queue.`,
            ),
          );
        }
        this.handleError(
          new PanicError(
            `Unexpected reply from ACKNOWLEDGE_MESSAGE script: ${reply}`,
          ),
        );
      },
    );
  }

  protected unacknowledgeMessage(
    message: MessageEnvelope,
    unacknowledgmentReason: EMessageUnacknowledgementReason,
  ): void {
    this.messageUnack.unacknowledgeMessage(
      this.consumerId,
      message,
      unacknowledgmentReason,
      (err, reply) => {
        if (err) return this.handleError(err);
        if (!reply) return this.handleError(new CallbackEmptyReplyError());
        this.handleMessageUnacknowledgementResult(
          unacknowledgmentReason,
          reply,
        );
      },
    );
  }

  protected handleMessageUnacknowledgementResult(
    unacknowledgmentReason: EMessageUnacknowledgementReason,
    messageUnacknowledgementStatus: TMessageUnacknowledgementStatus,
  ): void {
    for (const messageId in messageUnacknowledgementStatus) {
      this.logger.info(
        `Message ${messageId} unacknowledged successfully with reason: ${unacknowledgmentReason}`,
      );

      this.emit(
        'consumer.consumeMessage.messageUnacknowledged',
        messageId,
        this.queue,
        this.messageHandlerId,
        this.consumerId,
        unacknowledgmentReason,
      );
      this.logger.debug(
        `Emitted consumer.consumeMessage.messageUnacknowledged event for message ${messageId}`,
      );

      const unknowledgment = messageUnacknowledgementStatus[messageId];
      if (
        unknowledgment.action === EMessageUnacknowledgementAction.DEAD_LETTER
      ) {
        this.logger.info(
          `Message ${messageId} moved to dead letter queue with reason: ${unknowledgment.deadLetterReason}`,
        );
        this.emit(
          'consumer.consumeMessage.messageDeadLettered',
          messageId,
          this.queue,
          this.messageHandlerId,
          this.consumerId,
          unknowledgment.deadLetterReason,
        );
        this.logger.debug(
          `Emitted consumer.consumeMessage.messageDeadLettered event for message ${messageId}`,
        );
      } else if (
        unknowledgment.action === EMessageUnacknowledgementAction.DELAY
      ) {
        this.logger.info(`Message ${messageId} delayed for retry`);
        this.emit(
          'consumer.consumeMessage.messageDelayed',
          messageId,
          this.queue,
          this.messageHandlerId,
          this.consumerId,
        );
        this.logger.debug(
          `Emitted consumer.consumeMessage.messageDelayed event for message ${messageId}`,
        );
      } else {
        this.logger.info(`Message ${messageId} requeued for retry`);
        this.emit(
          'consumer.consumeMessage.messageRequeued',
          messageId,
          this.queue,
          this.messageHandlerId,
          this.consumerId,
        );
        this.logger.debug(
          `Emitted consumer.consumeMessage.messageRequeued event for message ${messageId}`,
        );
      }
    }
  }

  protected getConsumeMessageWorker(messageHandlerFilename: string) {
    this.logger.debug(
      `Getting consume message worker for handler file: ${messageHandlerFilename}`,
    );
    if (!this.consumeMessageWorker) {
      this.logger.debug(
        `Creating new WorkerCallable for handler file: ${messageHandlerFilename}`,
      );
      this.consumeMessageWorker = new WorkerCallable<
        IMessageTransferable,
        void
      >(messageHandlerFilename);
    }
    return this.consumeMessageWorker;
  }

  protected invokeMessageHandler(
    messageHandler: TConsumerMessageHandler,
    msg: IMessageTransferable,
    cb: ICallback<void>,
  ): void {
    const messageId = msg.id;
    this.logger.debug(`Invoking message handler for message ${messageId}`);

    if (typeof messageHandler === 'string') {
      this.logger.debug(
        `Using worker-based message handler: ${messageHandler}`,
      );
      this.getConsumeMessageWorker(messageHandler).call(msg, (err) => {
        if (err) {
          this.logger.error(
            `Worker-based message handler failed for message ${messageId}: ${err.message}`,
          );
        } else {
          this.logger.debug(
            `Worker-based message handler completed successfully for message ${messageId}`,
          );
        }
        cb(err);
      });
    } else {
      this.logger.debug(
        `Using function-based message handler for message ${messageId}`,
      );
      try {
        messageHandler(msg, (err) => {
          if (err) {
            this.logger.error(
              `Function-based message handler failed for message ${messageId}: ${err.message}`,
            );
          } else {
            this.logger.debug(
              `Function-based message handler completed successfully for message ${messageId}`,
            );
          }
          cb(err);
        });
      } catch (err) {
        this.logger.error(
          `Exception in function-based message handler for message ${messageId}: ${err}`,
        );
        cb(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  protected consumeMessage(msg: MessageEnvelope): void {
    const messageId = msg.getId();
    this.logger.debug(`Consuming message ${messageId}`);

    let isCallbackHandled = false;
    try {
      let onConsumed: ICallback<void> = (err) => {
        if (isCallbackHandled) {
          this.logger.debug(
            `Ignoring onConsumed callback for message ${messageId} as already handled`,
          );
          return;
        }
        isCallbackHandled = true;
        if (this.isRunning()) {
          if (err) {
            this.logger.error(
              `Error consuming message ${messageId}: ${err.message}`,
            );
            const unacknowledgementReason =
              err instanceof AsyncCallbackTimeoutError
                ? EMessageUnacknowledgementReason.TIMEOUT
                : EMessageUnacknowledgementReason.UNACKNOWLEDGED;
            if (
              unacknowledgementReason ===
              EMessageUnacknowledgementReason.TIMEOUT
            ) {
              this.logger.warn(
                `Consume timeout (${consumeTimeout}ms) reached for message ${messageId}`,
              );
            }
            return this.unacknowledgeMessage(msg, unacknowledgementReason);
          }
          this.logger.debug(
            `Message ${messageId} consumed successfully, acknowledging`,
          );
          return this.acknowledgeMessage(msg);
        }
        this.logger.debug(
          `Ignoring onConsumed callback for message ${messageId} as consumer is not running`,
        );
      };

      const consumeTimeout = msg.producibleMessage.getConsumeTimeout();
      if (consumeTimeout) {
        this.logger.debug(
          `Setting consume timeout of ${consumeTimeout}ms for message ${messageId}`,
        );
        onConsumed = async.withTimeout(onConsumed, consumeTimeout);
      }

      this.logger.debug(
        `Transferring message ${messageId} for handler invocation`,
      );
      this.invokeMessageHandler(
        this.messageHandler,
        msg.transfer(),
        onConsumed,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Exception during message consumption for message ${messageId}: ${error}`,
      );
      isCallbackHandled = true;
      this.unacknowledgeMessage(
        msg,
        EMessageUnacknowledgementReason.CONSUME_ERROR,
      );
    }
  }

  protected validateMessageHandler = (cb: ICallback<void>): void => {
    if (typeof this.messageHandler === 'string') {
      this.logger.debug(
        `Validating message handler file: ${this.messageHandler}`,
      );

      const fileExtension = path.extname(this.messageHandler);
      if (!['.js', '.cjs'].includes(fileExtension)) {
        this.logger.error(
          `Invalid message handler file extension: ${fileExtension}, expected .js or .cjs`,
        );
        cb(new ConsumerMessageHandlerFilenameExtensionError());
      } else {
        this.logger.debug(
          `Checking if message handler file exists: ${this.messageHandler}`,
        );
        stat(this.messageHandler, (err) => {
          if (err) {
            this.logger.error(
              `Message handler file not found: ${this.messageHandler}, error: ${err.message}`,
            );
            cb(new ConsumerMessageHandlerFileError());
          } else {
            this.logger.debug(
              `Message handler file validated successfully: ${this.messageHandler}`,
            );
            cb();
          }
        });
      }
    } else {
      this.logger.debug(
        'Using function-based message handler, no file validation needed',
      );
      cb();
    }
  };

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(
      `ConsumeMessage going up for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        this.logger.debug('Initializing Redis client');
        this.redisClient.init((err) => {
          if (err) {
            this.logger.error(
              `Failed to initialize Redis client: ${err.message}`,
            );
          } else {
            this.logger.debug('Redis client initialized successfully');
          }
          cb(err);
        });
      },
      (cb: ICallback<void>) => {
        this.logger.debug('Validating message handler');
        this.validateMessageHandler((err) => {
          if (err) {
            this.logger.error(
              `Message handler validation failed: ${err.message}`,
            );
          } else {
            this.logger.debug('Message handler validated successfully');
          }
          cb(err);
        });
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(
      `ConsumeMessage going down for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return [
      (cb: ICallback<void>) => {
        this.logger.debug('Unacknowledging any processing messages');
        const unacknowledgementReason =
          EMessageUnacknowledgementReason.OFFLINE_MESSAGE_HANDLER;
        this.messageUnack.unacknowledgeMessagesInProcess(
          this.consumerId,
          [this.queue.queueParams],
          unacknowledgementReason,
          (err, result) => {
            if (err) {
              this.logger.error(
                `Error during message unacknowledgement: ${err.message} (ignoring)`,
              );
            } else if (result) {
              this.handleMessageUnacknowledgementResult(
                unacknowledgementReason,
                result,
              );
            } else {
              this.logger.debug('No messages to unacknowledge during cleanup');
            }
            cb();
          },
        );
      },
      (cb: ICallback<void>) => {
        if (this.consumeMessageWorker) {
          this.logger.debug('Shutting down consume message worker');
          this.consumeMessageWorker.shutdown((err) => {
            if (err) {
              this.logger.warn(
                `Error shutting down consume message worker: ${err.message}`,
              );
            } else {
              this.logger.debug(
                'Consume message worker shut down successfully',
              );
            }
            cb();
          });
        } else {
          this.logger.debug('No consume message worker to shut down');
          cb();
        }
      },
    ].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    this.logger.error(`ConsumeMessage error: ${err.message}`, err);
    this.emit(
      'consumer.consumeMessage.error',
      err,
      this.consumerId,
      this.queue,
    );
    this.logger.debug(`Emitted consumer.consumeMessage.error event`);
    super.handleError(err);
  }

  handleReceivedMessage(message: MessageEnvelope): void {
    const messageId = message.getId();
    this.logger.debug(`Received message ${messageId}`);

    if (this.isRunning()) {
      if (message.getSetExpired()) {
        this.logger.info(
          `Message ${messageId} has expired, unacknowledging with TTL_EXPIRED reason`,
        );
        this.unacknowledgeMessage(
          message,
          EMessageUnacknowledgementReason.TTL_EXPIRED,
        );
      } else {
        this.logger.debug(
          `Message ${messageId} is valid, proceeding with consumption`,
        );
        this.consumeMessage(message);
      }
    } else {
      this.logger.warn(
        `Ignoring received message ${messageId} as consumer is not running`,
      );
    }
  }
}
