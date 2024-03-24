/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, Runnable } from 'redis-smq-common';
import { TConsumerMessageHandlerRunnerEvent } from '../../../common/index.js';
import { Configuration } from '../../../config/configuration.js';
import { IQueueParsedParams } from '../../queue/index.js';
import { Consumer } from '../consumer/consumer.js';
import { ConsumerMessageHandlerAlreadyExistsError } from '../errors/index.js';
import {
  IConsumerMessageHandlerArgs,
  TConsumerMessageHandler,
} from '../types/index.js';
import { MessageHandler } from '../message-handler/message-handler/message-handler.js';
import { eventBusPublisher } from './event-bus-publisher.js';

export class MessageHandlerRunner extends Runnable<TConsumerMessageHandlerRunnerEvent> {
  protected consumer;
  protected logger;
  protected messageHandlerInstances: MessageHandler[] = [];
  protected messageHandlers: IConsumerMessageHandlerArgs[] = [];

  constructor(consumer: Consumer, logger: ILogger) {
    super();
    this.consumer = consumer;
    this.logger = logger;
    if (Configuration.getSetConfig().eventBus.enabled) {
      eventBusPublisher(this, this.consumer.getId(), logger);
    }
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected getMessageHandlerInstance(
    queue: IQueueParsedParams,
  ): MessageHandler | undefined {
    const { queueParams, groupId } = queue;
    return this.messageHandlerInstances.find((i) => {
      const handlerQueue = i.getQueue();
      return (
        handlerQueue.queueParams.name === queueParams.name &&
        handlerQueue.queueParams.ns === queueParams.ns &&
        handlerQueue.groupId === groupId
      );
    });
  }

  protected getMessageHandler(
    queue: IQueueParsedParams,
  ): IConsumerMessageHandlerArgs | undefined {
    const { queueParams, groupId } = queue;
    return this.messageHandlers.find(
      (i) =>
        i.queue.queueParams.name === queueParams.name &&
        i.queue.queueParams.ns === queueParams.ns &&
        i.queue.groupId === groupId,
    );
  }

  protected createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerArgs,
  ): MessageHandler {
    const instance = new MessageHandler(
      this.consumer,
      this.logger,
      handlerParams,
    );
    instance.on('consumer.messageHandler.error', (err, consumerId, queue) => {
      // this.handleError(err)
      this.removeMessageHandler(queue, () => {
        this.logger.error(err);
      });
    });
    this.messageHandlerInstances.push(instance);
    this.logger.info(
      `Created a new instance (ID: ${instance.getId()}) for MessageHandler (${JSON.stringify(
        handlerParams,
      )}).`,
    );
    return instance;
  }

  protected runMessageHandler(
    handlerParams: IConsumerMessageHandlerArgs,
    cb: ICallback<void>,
  ): void {
    const handler = this.createMessageHandlerInstance(handlerParams);
    handler.run((err) => {
      if (err) this.removeMessageHandler(handlerParams.queue, () => cb(err));
      else {
        cb();
      }
    });
  }

  protected shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback<void>,
  ): void {
    const queue = messageHandler.getQueue();
    // ignoring errors
    messageHandler.shutdown(() => {
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (handler) => {
          const iQueue = handler.getQueue();
          return !(
            iQueue.queueParams.name === queue.queueParams.name &&
            iQueue.queueParams.ns === queue.queueParams.ns &&
            iQueue.groupId === queue.groupId
          );
        },
      );
      cb();
    });
  }

  protected runMessageHandlers = (cb: ICallback<void>): void => {
    async.each(
      this.messageHandlers,
      (handlerParams, _, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      cb,
    );
  };

  protected shutDownMessageHandlers = (cb: ICallback<void>): void => {
    async.each(
      this.messageHandlerInstances,
      (handler, queue, done) => {
        this.shutdownMessageHandler(
          handler,
          // ignoring errors
          () => done(),
        );
      },
      () => {
        this.messageHandlerInstances = [];
        cb();
      },
    );
  };

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([this.runMessageHandlers]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [this.shutDownMessageHandlers].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.emit(
        'consumer.messageHandlerRunner.error',
        err,
        this.consumer.getId(),
      );
    }
    super.handleError(err);
  }

  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback<void>): void {
    const { queueParams, groupId } = queue;
    const handler = this.getMessageHandler(queue);
    if (!handler) cb();
    else {
      this.messageHandlers = this.messageHandlers.filter((handler) => {
        const handerQueue = handler.queue;
        return !(
          queueParams.name === handerQueue.queueParams.name &&
          queueParams.ns === handerQueue.queueParams.ns &&
          groupId === handerQueue.groupId
        );
      });
      this.logger.info(
        `Message handler with parameters (${JSON.stringify(
          queue,
        )}) has been removed.`,
      );
      const handlerInstance = this.getMessageHandlerInstance(queue);
      if (handlerInstance) this.shutdownMessageHandler(handlerInstance, cb);
      else cb();
    }
  }

  addMessageHandler(
    queue: IQueueParsedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const handler = this.getMessageHandler(queue);
    if (handler) cb(new ConsumerMessageHandlerAlreadyExistsError(queue));
    else {
      const handlerParams = {
        queue,
        messageHandler,
      };
      this.messageHandlers.push(handlerParams);
      this.logger.info(
        `Message handler with parameters (${JSON.stringify(
          handlerParams,
        )}) has been registered.`,
      );
      if (this.isRunning()) {
        this.runMessageHandler(handlerParams, cb);
      } else cb();
    }
  }

  getQueues(): IQueueParsedParams[] {
    return this.messageHandlers.map((i) => i.queue);
  }
}
