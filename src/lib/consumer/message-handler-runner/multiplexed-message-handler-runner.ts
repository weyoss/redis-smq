/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, Timer } from 'redis-smq-common';
import { Consumer } from '../consumer/consumer.js';
import { MessageHandler } from '../message-handler/message-handler/message-handler.js';
import { MessageHandlerRunner } from './message-handler-runner.js';
import { IConsumerMessageHandlerArgs } from '../types/index.js';
import { MultiplexedMessageHandler } from '../message-handler/multiplexed-message-handler.js';

export class MultiplexedMessageHandlerRunner extends MessageHandlerRunner {
  protected timer;
  protected index = 0;
  protected activeMessageHandler: MessageHandler | null | undefined = null;

  constructor(consumer: Consumer, logger: ILogger) {
    super(consumer, logger);
    this.timer = new Timer();
    this.timer.on('error', (err) => this.handleError(err));
  }

  protected nextTick(): void {
    if (this.isRunning()) {
      this.activeMessageHandler = null;
      this.timer.setTimeout(() => this.execNextMessageHandler(), 1000);
    }
  }

  protected getNextMessageHandler(): MessageHandler | undefined {
    if (this.index >= this.messageHandlerInstances.length) {
      this.index = 0;
    }
    const messageHandler = this.messageHandlerInstances[this.index];
    if (this.messageHandlerInstances.length > 1) {
      this.index += 1;
    }
    return messageHandler;
  }

  protected execNextMessageHandler = (): void => {
    this.activeMessageHandler = this.getNextMessageHandler();
    if (this.activeMessageHandler && this.activeMessageHandler.isRunning()) {
      this.activeMessageHandler.dequeue();
    } else {
      this.nextTick();
    }
  };

  protected override createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerArgs,
  ): MessageHandler {
    const instance = new MultiplexedMessageHandler(
      this.consumer,
      handlerParams,
      this.logger,
      this.execNextMessageHandler,
    );
    this.messageHandlerInstances.push(instance);
    this.logger.info(
      `Created a new instance (ID: ${instance.getId()}) for MessageHandler (${JSON.stringify(
        handlerParams,
      )}).`,
    );
    return instance;
  }

  protected override shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback<void>,
  ): void {
    super.shutdownMessageHandler(messageHandler, () => {
      if (messageHandler === this.activeMessageHandler) {
        this.nextTick();
      }
      cb();
    });
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        this.execNextMessageHandler();
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.timer.reset();
    return super.goingDown();
  }
}
