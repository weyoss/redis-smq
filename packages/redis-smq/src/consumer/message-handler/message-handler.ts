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
  CallbackInvalidReplyError,
  env,
  ICallback,
  ILogger,
  logger,
  Runnable,
  WorkerResourceGroup,
} from 'redis-smq-common';
import {
  TConsumerMessageHandlerEvent,
  TRedisSMQEvent,
} from '../../common/index.js';
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { _parseMessage } from '../../message/_/_parse-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../message/index.js';
import { EQueueProperty, IQueueParsedParams } from '../../queue/index.js';
import { Consumer } from '../consumer.js';
import { IConsumerMessageHandlerArgs } from '../types/index.js';
import { ConsumeMessage } from './consume-message/consume-message.js';
import { DequeueMessage } from './dequeue-message/dequeue-message.js';
import { evenBusPublisher } from './even-bus-publisher.js';
import { ConsumerMessageHandlerError } from './errors/index.js';
import { EventBus } from '../../event-bus/index.js';

const WORKERS_DIR = path.resolve(env.getCurrentDir(), '../workers');

export class MessageHandler extends Runnable<TConsumerMessageHandlerEvent> {
  protected consumer;
  protected consumerId;
  protected queue;
  protected logger;
  protected dequeueMessage;
  protected consumeMessage;
  protected messageHandler;
  protected autoDequeue;
  protected redisClient;
  protected eventBus;
  protected workerResourceGroup: WorkerResourceGroup | null = null;

  constructor(
    consumer: Consumer,
    redisClient: RedisClient,
    handlerParams: IConsumerMessageHandlerArgs,
    autoDequeue: boolean = true,
    eventBus: EventBus | null,
  ) {
    super();
    const { queue, messageHandler } = handlerParams;
    this.consumer = consumer;
    this.consumerId = consumer.getId();
    this.queue = queue;
    this.messageHandler = messageHandler;
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );

    this.logger.info(
      `Initializing MessageHandler for consumer ${this.consumerId}, queue ${JSON.stringify(this.queue)}`,
    );
    this.logger.debug(
      `autoDequeue: ${autoDequeue}, messageHandler type: ${typeof messageHandler}`,
    );

    this.autoDequeue = autoDequeue;
    this.redisClient = redisClient;
    this.eventBus = eventBus;

    if (this.eventBus) {
      this.logger.debug('Event bus provided, setting up event bus publisher');
      evenBusPublisher(this, this.eventBus, this.logger);
    } else {
      this.logger.debug(
        'No event bus provided, skipping event bus publisher setup',
      );
    }

    this.logger.debug('Initializing DequeueMessage instance');
    this.dequeueMessage = this.initDequeueMessageInstance();

    this.logger.debug('Initializing ConsumeMessage instance');
    this.consumeMessage = this.initConsumeMessageInstance();

    this.logger.debug('Registering system events');
    this.registerSystemEvents();

    this.logger.info(
      `MessageHandler initialized for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
  }

  protected initDequeueMessageInstance(): DequeueMessage {
    this.logger.debug('Creating new DequeueMessage instance');
    const instance = new DequeueMessage(
      new RedisClient(),
      this.queue,
      this.consumer,
      this.eventBus,
    );
    this.logger.debug('Setting up error handler for DequeueMessage instance');
    instance.on('consumer.dequeueMessage.error', this.onError);
    this.logger.debug('DequeueMessage instance created successfully');
    return instance;
  }

  protected initConsumeMessageInstance(): ConsumeMessage {
    this.logger.debug('Creating new ConsumeMessage instance');
    const instance = new ConsumeMessage(
      this.redisClient,
      this.consumer,
      this.queue,
      this.getId(),
      this.messageHandler,
      this.eventBus,
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
   *             The callback takes an error as its argument, which will be null if no error occurred.
   */
  protected setUpConsumerWorkers = (cb: ICallback<void>): void => {
    this.logger.debug('Setting up consumer workers');

    const config = Configuration.getSetConfig();
    const { keyQueueWorkersLock } = redisKeys.getQueueKeys(
      this.queue.queueParams,
      this.queue.groupId,
    );

    this.logger.debug(`Queue workers lock key: ${keyQueueWorkersLock}`);

    const redisClient = this.redisClient.getInstance();
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

    this.workerResourceGroup.loadFromDir(
      WORKERS_DIR,
      { config, queueParsedParams: this.queue },
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

  protected shutDownConsumerWorkers = (cb: ICallback<void>): void => {
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
   *
   * @returns An array of functions, each representing a setup operation to be executed in sequence.
   *
   * @remarks
   * This method extends the `goingUp` process from the parent class by adding additional setup steps specific to the MessageHandler.
   * It includes running the `dequeueMessage` and `consumeMessage` instances, optionally starting the dequeue process, and setting up consumer workers.
   */
  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(
      `MessageHandler going up for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
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
      (cb: ICallback<void>) => {
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
      (cb: ICallback<void>) => {
        if (this.autoDequeue) {
          this.logger.debug('Auto-dequeue enabled, initiating first dequeue');
          this.dequeue();
        } else {
          this.logger.debug('Auto-dequeue disabled, skipping initial dequeue');
        }
        cb();
      },
      this.setUpConsumerWorkers,
    ]);
  }

  /**
   * Performs cleanup operations and shuts down the consumer workers before shutting down the MessageHandler instance.
   *
   * @remarks
   * This method is called when the MessageHandler instance is being shut down. It ensures that all resources are properly cleaned up and that any running worker processes are terminated.
   * The method executes the following steps:
   * 1. Calls the `shutDownConsumerWorkers` method to terminate any running consumer worker processes.
   * 2. Shuts down the `dequeueMessage` and `consumeMessage` instances by calling their respective `shutdown` methods.
   * 3. Calls the `super.goingDown` method to perform any additional cleanup operations defined in the parent class.
   *
   * @returns An array of functions, each representing a cleanup operation to be executed in sequence.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(
      `MessageHandler going down for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    return [
      this.shutDownConsumerWorkers,
      (cb: ICallback<void>) => {
        this.logger.debug('Shutting down DequeueMessage instance');
        this.dequeueMessage.shutdown((err) => {
          if (err) {
            this.logger.warn(
              `Error during DequeueMessage shutdown: ${err.message} (ignoring)`,
            );
          } else {
            this.logger.debug('DequeueMessage shut down successfully');
          }
          cb();
        });
      },
      (cb: ICallback<void>) => {
        this.logger.debug('Shutting down ConsumeMessage instance');
        this.consumeMessage.shutdown((err) => {
          if (err) {
            this.logger.warn(
              `Error during ConsumeMessage shutdown: ${err.message} (ignoring)`,
            );
          } else {
            this.logger.debug('ConsumeMessage shut down successfully');
          }
          cb();
        });
      },
    ].concat(super.goingDown());
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

    const redisClient = this.redisClient.getInstance();
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

        // An empty reply indicates that the message was not in a PENDING state,
        // likely because another consumer processed it first. This is an
        // unexpected outcome as messages are dequeued atomically and placed
        // into the processing queue.
        if (!reply) {
          const errMsg = `Message ${messageId} could not be fetched.`;
          this.logger.error(errMsg);
          return this.handleError(new ConsumerMessageHandlerError(errMsg));
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
        this.consumeMessage.handleReceivedMessage(message);
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
    if (this.isRunning()) {
      this.logger.debug('Dequeuing message from queue');
      this.dequeueMessage.dequeue();
    } else {
      this.logger.debug('Ignoring dequeue call as handler is not running');
    }
  }

  /**
   * Retrieves the queue parameters associated with the current MessageHandler instance.
   *
   * @returns The queue parameters, represented by the `IQueueParsedParams` interface.
   *
   * @remarks
   * This method returns the queue parameters that were provided when creating the MessageHandler instance.
   * The returned object contains information about the queue, such as the queue name, consumer group ID, and other relevant details.
   */
  getQueue(): IQueueParsedParams {
    this.logger.debug(
      `Getting queue parameters: ${JSON.stringify(this.queue)}`,
    );
    return this.queue;
  }
}
