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
  getDirname,
  ICallback,
  ILogger,
  Runnable,
  WorkerResourceGroup,
} from 'redis-smq-common';
import {
  TConsumerMessageHandlerEvent,
  TRedisSMQEvent,
} from '../../../../common/index.js';
import { RedisClient } from '../../../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../../config/index.js';
import { EventBus } from '../../../event-bus/index.js';
import { _fromMessage } from '../../../message/_/_from-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../message/index.js';
import { IQueueParsedParams } from '../../../queue/index.js';
import { Consumer } from '../../consumer/consumer.js';
import {
  EMessageUnknowledgmentReason,
  IConsumerMessageHandlerArgs,
} from '../../types/index.js';
import { ConsumeMessage } from '../consume-message/consume-message.js';
import { DequeueMessage } from '../dequeue-message/dequeue-message.js';
import { processingQueue } from '../processing-queue/processing-queue.js';
import { evenBusPublisher } from './even-bus-publisher.js';

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
    logger: ILogger,
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
    this.logger = logger;
    this.autoDequeue = autoDequeue;
    this.redisClient = redisClient;
    this.eventBus = eventBus;
    if (this.eventBus) {
      evenBusPublisher(this, this.eventBus, this.logger);
    }
    this.dequeueMessage = this.initDequeueMessageInstance();
    this.consumeMessage = this.initConsumeMessageInstance();
    this.registerSystemEvents();
  }

  protected initDequeueMessageInstance(): DequeueMessage {
    const instance = new DequeueMessage(
      new RedisClient(),
      this.queue,
      this.consumer,
      this.logger,
      this.eventBus,
    );
    instance.on('consumer.dequeueMessage.error', this.onError);
    return instance;
  }

  protected initConsumeMessageInstance(): ConsumeMessage {
    const instance = new ConsumeMessage(
      this.redisClient,
      this.consumer,
      this.queue,
      this.getId(),
      this.messageHandler,
      this.logger,
      this.eventBus,
    );
    instance.on('consumer.consumeMessage.error', this.onError);
    return instance;
  }

  protected onMessageReceived: TRedisSMQEvent['consumer.dequeueMessage.messageReceived'] =
    (messageId) => {
      this.processMessage(messageId);
    };

  protected onMessageUnacknowledged: TRedisSMQEvent['consumer.consumeMessage.messageUnacknowledged'] =
    () => {
      this.next();
    };

  protected onMessageAcknowledged: TRedisSMQEvent['consumer.consumeMessage.messageAcknowledged'] =
    () => {
      this.next();
    };

  protected onMessageNext: TRedisSMQEvent['consumer.dequeueMessage.nextMessage'] =
    () => {
      this.next();
    };

  protected onError = (err: Error) => {
    // ignore errors that may occur during shutdown
    if (this.isRunning()) {
      this.handleError(err);
    }
  };

  protected registerSystemEvents = (): void => {
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
  };

  protected cleanUp(cb: ICallback<void>): void {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      // ignoring errors
      return cb();
    }
    processingQueue.unknowledgeMessage(
      redisClient,
      this.consumerId,
      [this.queue.queueParams],
      this.logger,
      EMessageUnknowledgmentReason.OFFLINE_MESSAGE_HANDLER,
      // ignoring errors
      () => cb(),
    );
  }

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
      this.emit(
        'consumer.messageHandler.error',
        err,
        this.consumerId,
        this.queue,
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
    const config = Configuration.getSetConfig();
    const { keyQueueWorkersLock } = redisKeys.getQueueKeys(
      this.queue.queueParams,
      this.queue.groupId,
    );
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      cb(redisClient);
      return void 0;
    }
    this.workerResourceGroup = new WorkerResourceGroup(
      redisClient,
      this.logger,
      keyQueueWorkersLock,
    );
    this.workerResourceGroup.on('workerResourceGroup.error', (err) =>
      this.handleError(err),
    );
    const workersDir = path.resolve(getDirname(), '../../workers');
    this.workerResourceGroup.loadFromDir(
      workersDir,
      { config, queueParsedParams: this.queue },
      (err) => {
        if (err) cb(err);
        else {
          this.workerResourceGroup?.run((err) => {
            if (err) this.handleError(err);
          });
          cb();
        }
      },
    );
  };

  protected shutDownConsumerWorkers = (cb: ICallback<void>): void => {
    if (this.workerResourceGroup) {
      this.workerResourceGroup.shutdown(() => {
        this.workerResourceGroup = null;
        cb();
      });
    } else {
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
    return super.goingUp().concat([
      (cb: ICallback<void>) => this.dequeueMessage.run((err) => cb(err)),
      (cb: ICallback<void>) => this.consumeMessage.run((err) => cb(err)),
      (cb: ICallback<void>) => {
        if (this.autoDequeue) this.dequeue();
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
   * 3. Calls the `cleanUp` method to perform any necessary cleanup operations, such as acknowledging any unacknowledged messages.
   * 4. Calls the `super.goingDown` method to perform any additional cleanup operations defined in the parent class.
   *
   * @returns An array of functions, each representing a cleanup operation to be executed in sequence.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      this.shutDownConsumerWorkers,
      (cb: ICallback<void>) => this.dequeueMessage.shutdown(() => cb()),
      (cb: ICallback<void>) => this.consumeMessage.shutdown(() => cb()),
      (cb: ICallback<void>) => this.cleanUp(cb),
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
    if (this.isRunning()) {
      const { keyMessage } = redisKeys.getMessageKeys(messageId);
      const keys: string[] = [keyMessage];
      const argv: (string | number)[] = [
        EMessageProperty.STATUS,
        EMessageProperty.STATE,
        EMessageProperty.MESSAGE,
        EMessagePropertyStatus.PROCESSING,
      ];
      const redisClient = this.redisClient.getInstance();
      if (redisClient instanceof Error) {
        this.handleError(redisClient);
        return void 0;
      }
      redisClient.runScript(
        ELuaScriptName.FETCH_MESSAGE_FOR_PROCESSING,
        keys,
        argv,
        (err, reply: unknown) => {
          if (err) {
            return this.handleError(err);
          }
          if (!reply) {
            return this.handleError(new CallbackEmptyReplyError());
          }
          if (!Array.isArray(reply)) {
            return this.handleError(new CallbackInvalidReplyError());
          }
          const [state, msg]: string[] = reply;
          const message = _fromMessage(
            msg,
            EMessagePropertyStatus.PROCESSING,
            state,
          );
          this.consumeMessage.handleReceivedMessage(message);
        },
      );
    }
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
      this.dequeueMessage.dequeue();
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
    return this.queue;
  }
}
