/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'path';
import {
  CallbackEmptyReplyError,
  CallbackInvalidReplyError,
  createLogger,
  env,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
  Runnable,
  WorkerResourceGroup,
} from 'redis-smq-common';
import {
  TConsumerMessageHandlerEvent,
  TRedisSMQEvent,
} from '../../common/index.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { _parseMessage } from '../../message-manager/_/_parse-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import {
  EQueueProperty,
  IQueueParsedParams,
} from '../../queue-manager/index.js';
import { ConsumeMessage } from './consume-message/consume-message.js';
import { DequeueMessage } from './dequeue-message/dequeue-message.js';
import { evenBusPublisher } from './even-bus-publisher.js';
import { MessageHandlerError } from '../../errors/index.js';
import { IConsumerMessageHandlerParams } from './types/index.js';
import { TConsumerMessageHandlerWorkerPayload } from './workers/types/index.js';
import { ERedisConnectionAcquisitionMode } from '../../common/redis-connection-pool/types/connection-pool.js';
import { RedisConnectionPool } from '../../common/redis-connection-pool/redis-connection-pool.js';
import { _deleteEphemeralConsumerGroup } from './_/_delete-ephemeral-consumer-group.js';
import { _prepareConsumerGroup } from './_/_prepare-consumer-group.js';

const WORKERS_DIR = path.resolve(env.getCurrentDir(), './workers');

export class MessageHandler extends Runnable<TConsumerMessageHandlerEvent> {
  protected consumerId;
  protected queue;
  protected logger: ILogger;
  protected dequeueMessage: DequeueMessage | null = null;
  protected consumeMessage: ConsumeMessage | null = null;
  protected messageHandler;
  protected autoDequeue;
  protected workerResourceGroup: WorkerResourceGroup | null = null;
  protected redisClient: IRedisClient | null = null;

  // Tracks an auto-generated ephemeral consumer group for PUB_SUB
  protected ephemeralConsumerGroupId: string | null = null;

  constructor(
    consumerId: string,
    handlerParams: IConsumerMessageHandlerParams,
    autoDequeue: boolean = true,
  ) {
    super();
    const { queue, messageHandler } = handlerParams;
    this.consumerId = consumerId;
    this.queue = queue;
    this.messageHandler = messageHandler;

    const config = Configuration.getConfig();
    this.logger = createLogger(
      config.logger,
      `${this.constructor.name.toLowerCase()}-${this.getId()}`,
    );

    this.logger.info(
      `Initializing MessageHandler for consumer ${this.consumerId}, queue ${JSON.stringify(this.queue)}`,
    );
    this.logger.debug(
      `autoDequeue: ${autoDequeue}, messageHandler type: ${typeof messageHandler}`,
    );

    this.autoDequeue = autoDequeue;

    if (config.eventBus.enabled) {
      this.logger.debug('Event bus is enabled, setting up event bus publisher');
      evenBusPublisher(this);
    } else {
      this.logger.debug(
        'Event bus is not enabled, skipping event bus publisher setup',
      );
    }

    this.logger.info(
      `MessageHandler initialized for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
  }

  /**
   * Processes a message by fetching it from the queue and updating its status to 'processing'.
   *
   * @param messageId - The unique identifier of the message to be processed.
   *
   * @remarks
   * This method checks if the MessageHandler instance is running. If it is, it retrieves the message from the queue using the provided `messageId`.
   * It then updates the message's status to 'processing' and passes it to the `consumeMessage` instance for further handling.
   * If the MessageHandler instance is not running, this method does nothing.
   *
   * @returns {void}
   */
  processMessage(messageId: string): void {
    if (!this.isRunning()) {
      this.logger.debug(
        `Ignoring processMessage call for message ${messageId} as handler is not running`,
      );
      return;
    }

    if (!this.consumeMessage) {
      // Should not happen post goingUp, but guard for safety
      this.logger.warn(
        'ConsumeMessage instance is not initialized yet. Skipping processMessage call.',
      );
      return;
    }

    const consumeMessage = this.consumeMessage;

    this.logger.debug(`Processing message ${messageId}`);

    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    this.logger.debug(`Message key: ${keyMessage}`);

    const { keyQueueProperties } = redisKeys.getQueueKeys(
      this.queue.queueParams,
      this.queue.groupId,
    );

    const keys: string[] = [keyMessage, keyQueueProperties];
    const argv: (string | number)[] = [
      EMessageProperty.PROCESSING_STARTED_AT,
      Date.now(),
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PROCESSING,
      EMessagePropertyStatus.PENDING, // Required for atomic check
      EMessageProperty.ATTEMPTS,
      EQueueProperty.PROCESSING_MESSAGES_COUNT,
      EQueueProperty.PENDING_MESSAGES_COUNT,
    ];

    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) {
      this.logger.error(`Failed to get Redis client: ${redisClient.message}`);
      this.handleError(redisClient);
      return;
    }

    this.logger.debug(
      `Running FETCH_MESSAGE_FOR_PROCESSING script for message ${messageId}`,
    );
    redisClient.runScript(
      ELuaScriptName.CHECKOUT_MESSAGE,
      keys,
      argv,
      (err, reply: unknown) => {
        if (err) {
          this.logger.error(
            `Failed to fetch message ${messageId} for processing: ${err.message}`,
          );
          return this.handleError(err);
        }

        // An empty reply indicates that the message was not in a PENDING state.
        if (!reply) {
          const errMsg = `Message ${messageId} could not be fetched.`;
          this.logger.error(errMsg);
          return this.handleError(new MessageHandlerError(errMsg));
        }

        if (!Array.isArray(reply)) {
          this.logger.error(
            `Invalid reply type when fetching message ${messageId}`,
          );
          return this.handleError(new CallbackInvalidReplyError());
        }

        this.logger.debug(
          `Message ${messageId} fetched successfully. Parsing message raw data...`,
        );

        const message = _parseMessage(reply);

        this.logger.debug(
          `Passing message ${messageId} to ConsumeMessage for handling`,
        );
        consumeMessage.handleReceivedMessage(message);
      },
    );
  }

  /**
   * Processes the next message in the queue by dequeuing it and making it available for consumption.
   *
   * This method calls the `dequeue` method of the `dequeueMessage` instance to retrieve a message from the queue.
   * If the MessageHandler instance is not running, this method does nothing.
   *
   * @remarks
   * The `dequeue` method ensures that only one consumer instance processes a message at a time, preventing message duplication.
   *
   * @returns {void}
   */
  next(): void {
    this.logger.debug('Requesting next message');
    this.dequeue();
  }

  /**
   * Dequeues a message from the associated queue.
   *
   * This method checks if the MessageHandler instance is running and then calls the `dequeue` method of the `dequeueMessage` instance.
   * If the MessageHandler instance is not running, the method does nothing.
   *
   * @remarks
   * The `dequeue` method is responsible for retrieving a message from the queue and making it available for processing.
   * It ensures that only one consumer instance processes a message at a time, preventing message duplication.
   *
   * @returns {void}
   */
  dequeue(): void {
    if (!this.isRunning()) {
      this.logger.debug('Ignoring dequeue call as handler is not running');
      return;
    }
    if (!this.dequeueMessage) {
      // Should not happen post goingUp, but guard for safety
      this.logger.warn(
        'DequeueMessage instance is not initialized yet. Skipping dequeue call.',
      );
      return;
    }
    this.logger.debug('Dequeuing message from queue');
    this.dequeueMessage.dequeue();
  }

  getQueue(): IQueueParsedParams {
    this.logger.debug(
      `Getting queue parameters: ${JSON.stringify(this.queue)}`,
    );
    return this.queue;
  }

  protected getRedisClient(): IRedisClient | PanicError {
    if (!this.redisClient) return new PanicError('Redis Client is missing');
    return this.redisClient;
  }

  protected initDequeueMessageInstance(): DequeueMessage {
    this.logger.debug('Creating new DequeueMessage instance');
    const instance = new DequeueMessage(this.queue, this.consumerId);
    this.logger.debug('Setting up error handler for DequeueMessage instance');
    instance.on('consumer.dequeueMessage.error', this.onError);
    this.logger.debug('DequeueMessage instance created successfully');
    return instance;
  }

  protected initConsumeMessageInstance(): ConsumeMessage {
    this.logger.debug('Creating new ConsumeMessage instance');
    const instance = new ConsumeMessage(
      this.consumerId,
      this.queue,
      this.getId(),
      this.messageHandler,
    );
    this.logger.debug('Setting up error handler for ConsumeMessage instance');
    instance.on('consumer.consumeMessage.error', this.onError);
    this.logger.debug('ConsumeMessage instance created successfully');
    return instance;
  }

  protected onMessageReceived: TRedisSMQEvent['consumer.dequeueMessage.messageReceived'] =
    (messageId) => {
      this.logger.debug(
        `Message received event for message ${messageId}, processing`,
      );
      this.processMessage(messageId);
    };

  protected onMessageUnacknowledged: TRedisSMQEvent['consumer.consumeMessage.messageUnacknowledged'] =
    (messageId) => {
      this.logger.debug(
        `Message unacknowledged event for message ${messageId}, requesting next message`,
      );
      this.next();
    };

  protected onMessageAcknowledged: TRedisSMQEvent['consumer.consumeMessage.messageAcknowledged'] =
    (messageId) => {
      this.logger.debug(
        `Message acknowledged event for message ${messageId}, requesting next message`,
      );
      this.next();
    };

  protected onMessageNext: TRedisSMQEvent['consumer.dequeueMessage.nextMessage'] =
    () => {
      this.logger.debug('Next message event received, requesting next message');
      this.next();
    };

  protected onError = (err: Error) => {
    // ignore errors that may occur during shutdown
    if (this.isRunning()) {
      this.logger.error(`Error event received while running: ${err.message}`);
      this.handleError(err);
    } else {
      this.logger.debug(
        `Ignoring error event received during shutdown: ${err.message}`,
      );
    }
  };

  protected registerSystemEvents = (): void => {
    if (!this.dequeueMessage || !this.consumeMessage) return;
    this.logger.debug('Registering system event handlers');
    this.dequeueMessage.on(
      'consumer.dequeueMessage.messageReceived',
      this.onMessageReceived,
    );
    this.dequeueMessage.on(
      'consumer.dequeueMessage.nextMessage',
      this.onMessageNext,
    );
    this.consumeMessage.on(
      'consumer.consumeMessage.messageUnacknowledged',
      this.onMessageUnacknowledged,
    );
    this.consumeMessage.on(
      'consumer.consumeMessage.messageAcknowledged',
      this.onMessageAcknowledged,
    );
    this.logger.debug('All system event handlers registered successfully');
  };

  protected unregisterSystemEvents = (): void => {
    if (!this.dequeueMessage || !this.consumeMessage) return;
    this.logger.debug('Unregistering system event handlers');
    this.dequeueMessage.removeListener(
      'consumer.dequeueMessage.messageReceived',
      this.onMessageReceived,
    );
    this.dequeueMessage.removeListener(
      'consumer.dequeueMessage.nextMessage',
      this.onMessageNext,
    );
    this.consumeMessage.removeListener(
      'consumer.consumeMessage.messageUnacknowledged',
      this.onMessageUnacknowledged,
    );
    this.consumeMessage.removeListener(
      'consumer.consumeMessage.messageAcknowledged',
      this.onMessageAcknowledged,
    );
    this.logger.debug('All system event handlers unregistered');
  };

  protected override getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Handles errors that occur during the operation of the MessageHandler.
   *
   * @param err - The error object that was encountered.
   *
   * @remarks
   * This method checks if the MessageHandler instance is currently running. If it is, it emits a 'consumer.messageHandler.error' event with the error, consumer ID, and queue information.
   * It then calls the parent class's `handleError` method to perform any additional error handling.
   */
  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.logger.error(`MessageHandler error: ${err.message}`, err);
      this.logger.debug(
        `Emitting consumer.messageHandler.error event for consumer ${this.consumerId}`,
      );
      this.emit(
        'consumer.messageHandler.error',
        err,
        this.consumerId,
        this.queue,
      );
    } else {
      this.logger.debug(
        `Error occurred while not running: ${err.message} (ignoring)`,
      );
    }
    super.handleError(err);
  }

  /**
   * Sets up and initializes consumer workers.
   *
   * @param cb - A callback function that will be called once the setup is complete or if an error occurs.
   */
  protected setUpConsumerWorkers = (cb: ICallback): void => {
    this.logger.debug('Setting up consumer workers');

    const config = Configuration.getConfig();
    const { keyQueueWorkersLock } = redisKeys.getQueueKeys(
      this.queue.queueParams,
      this.queue.groupId,
    );

    this.logger.debug(`Queue workers lock key: ${keyQueueWorkersLock}`);

    const redisClient = this.getRedisClient();
    if (redisClient instanceof Error) {
      this.logger.error(`Failed to get Redis client: ${redisClient.message}`);
      cb(redisClient);
      return void 0;
    }

    this.logger.debug('Creating WorkerResourceGroup');
    this.workerResourceGroup = new WorkerResourceGroup(
      redisClient,
      this.logger,
      keyQueueWorkersLock,
    );

    this.logger.debug('Setting up error handler for WorkerResourceGroup');
    this.workerResourceGroup.on('workerResourceGroup.error', (err) => {
      this.logger.error(`WorkerResourceGroup error: ${err.message}`);
      this.handleError(err);
    });

    this.logger.debug(`Loading workers from directory: ${WORKERS_DIR}`);

    this.workerResourceGroup.loadFromDir<TConsumerMessageHandlerWorkerPayload>(
      WORKERS_DIR,
      { redisConfig: config.redis, queueParsedParams: this.queue },
      (err) => {
        if (err) {
          this.logger.error(
            `Failed to load workers from directory: ${err.message}`,
          );
          cb(err);
        } else {
          this.logger.debug(
            'Workers loaded successfully, starting WorkerResourceGroup',
          );
          this.workerResourceGroup?.run((err) => {
            if (err) {
              this.logger.error(
                `Failed to start WorkerResourceGroup: ${err.message}`,
              );
              this.handleError(err);
            } else {
              this.logger.debug('WorkerResourceGroup started successfully');
            }
          });
          this.logger.debug('Consumer workers setup completed');
          cb();
        }
      },
    );
  };

  protected shutDownConsumerWorkers = (cb: ICallback): void => {
    if (this.workerResourceGroup) {
      this.logger.debug('Shutting down consumer workers');
      this.workerResourceGroup.shutdown((err) => {
        if (err) {
          this.logger.warn(
            `Error during WorkerResourceGroup shutdown: ${err.message} (ignoring)`,
          );
        }
        this.logger.debug('Consumer workers shut down successfully');
        this.workerResourceGroup = null;
        cb();
      });
    } else {
      this.logger.debug('No consumer workers to shut down');
      cb();
    }
  };

  /**
   * Prepares the MessageHandler instance for operation by setting up necessary components and processes.
   */
  protected override goingUp(): ((cb: ICallback) => void)[] {
    this.logger.info(
      `MessageHandler going up for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return super.goingUp().concat([
      (cb: ICallback) => {
        RedisConnectionPool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, redisClient) => {
            if (err) return cb(err);
            if (!redisClient) return cb(new CallbackEmptyReplyError());
            this.redisClient = redisClient;
            cb();
          },
        );
      },

      /**
       * Ensures an appropriate consumer group is present for PUB_SUB queues.
       * - If delivery model is PUB_SUB and no groupId provided, creates an ephemeral consumer group.
       * - If a groupId is provided, ensures it exists (idempotent save).
       * - Updates this.queue.groupId.
       */
      (cb: ICallback) => {
        _prepareConsumerGroup(
          this.queue,
          this.consumerId,
          (err, effectiveGroupId) => {
            if (err) return cb(err);
            // Update queue with the effective group
            if (effectiveGroupId && this.queue.groupId !== effectiveGroupId) {
              this.queue = { ...this.queue, groupId: effectiveGroupId };
              this.ephemeralConsumerGroupId = effectiveGroupId;
              this.logger.debug(
                `Effective consumer group resolved: '${effectiveGroupId}'.`,
              );
            }
            cb();
          },
          this.logger,
        );
      },

      // Create DequeueMessage/ConsumeMessage only once, after consumer group is resolved
      (cb: ICallback) => {
        if (!this.consumeMessage) {
          this.consumeMessage = this.initConsumeMessageInstance();
        }
        if (!this.dequeueMessage) {
          this.dequeueMessage = this.initDequeueMessageInstance();
        }
        // Register system events exactly once
        this.registerSystemEvents();
        cb();
      },
      (cb: ICallback) => this.setUpConsumerWorkers(cb),
      (cb: ICallback) => {
        if (!this.consumeMessage) return cb();
        this.logger.debug('Starting ConsumeMessage instance');
        this.consumeMessage.run((err) => {
          if (err) {
            this.logger.error(`Failed to start ConsumeMessage: ${err.message}`);
          } else {
            this.logger.debug('ConsumeMessage started successfully');
          }
          cb(err);
        });
      },
      (cb: ICallback) => {
        if (!this.dequeueMessage) return cb();
        this.logger.debug('Starting DequeueMessage instance');
        this.dequeueMessage.run((err) => {
          if (err) {
            this.logger.error(`Failed to start DequeueMessage: ${err.message}`);
          } else {
            this.logger.debug('DequeueMessage started successfully');
          }
          cb(err);
        });
      },
      (cb: ICallback) => {
        if (this.autoDequeue) {
          this.logger.debug('Auto-dequeue enabled, initiating first dequeue');
          this.dequeue();
        } else {
          this.logger.debug('Auto-dequeue disabled, skipping initial dequeue');
        }
        cb();
      },
    ]);
  }

  /**
   * Performs cleanup operations and shuts down the consumer workers before shutting down the MessageHandler instance.
   */
  protected override goingDown(): ((cb: ICallback) => void)[] {
    this.logger.info(
      `MessageHandler going down for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return [
      // First, delete ephemeral consumer group if one was created
      (cb: ICallback): void => {
        const ephemeral = this.ephemeralConsumerGroupId;
        if (!ephemeral) return cb();

        this.logger.debug(
          `Deleting ephemeral consumer group '${ephemeral}' for queue '${this.queue.queueParams.name}'`,
        );
        _deleteEphemeralConsumerGroup(
          this.queue.queueParams,
          this.consumerId,
          ephemeral,
          (err) => {
            if (err) {
              this.logger.warn(
                `Failed to delete ephemeral consumer group '${ephemeral}': ${err.message}`,
              );
            } else {
              this.logger.debug(
                `Ephemeral consumer group '${ephemeral}' deleted successfully.`,
              );
            }
            this.ephemeralConsumerGroupId = null;
            cb();
          },
        );
      },
      this.shutDownConsumerWorkers,
      (cb: ICallback) => {
        // Unregister events before shutting down to avoid duplicate handlers on future runs
        this.unregisterSystemEvents();
        if (!this.dequeueMessage) return cb();
        this.logger.debug('Shutting down DequeueMessage instance');
        this.dequeueMessage.shutdown((err) => {
          if (err) {
            this.logger.warn(
              `Error during DequeueMessage shutdown: ${err.message} (ignoring)`,
            );
          } else {
            this.logger.debug('DequeueMessage shut down successfully');
          }
          this.dequeueMessage = null;
          cb();
        });
      },
      (cb: ICallback) => {
        if (!this.consumeMessage) return cb();
        this.logger.debug('Shutting down ConsumeMessage instance');
        this.consumeMessage.shutdown((err) => {
          if (err) {
            this.logger.warn(
              `Error during ConsumeMessage shutdown: ${err.message} (ignoring)`,
            );
          } else {
            this.logger.debug('ConsumeMessage shut down successfully');
          }
          this.consumeMessage = null;
          cb();
        });
      },
      (cb: ICallback) => {
        if (this.redisClient) {
          RedisConnectionPool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }
}
