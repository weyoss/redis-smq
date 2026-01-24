/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { DequeueMessage } from './dequeue-message/dequeue-message.js';
import { MessageHandler } from './message-handler.js';
import { IConsumerMessageHandlerParams } from './types/index.js';
import { IConsumerContext } from '../types/consumer-context.js';

export class MultiplexedMessageHandler extends MessageHandler {
  protected dequeueNextFn;

  constructor(
    consumerContext: IConsumerContext,
    handlerParams: IConsumerMessageHandlerParams,
    dequeueNextFn: () => void,
  ) {
    super(consumerContext, handlerParams, false);
    this.dequeueNextFn = dequeueNextFn;
    this.logger.info(
      `MultiplexedMessageHandler initialized for consumer ${this.consumerContext.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    this.logger.debug('Auto-dequeue disabled for multiplexed handler');
  }

  protected override createDequeueMessageInstance(): DequeueMessage {
    this.logger.debug(
      'Creating DequeueMessage instance for multiplexed handler with blockUntilMessageReceived=false and autoCloseRedisConnection=false',
    );
    return new DequeueMessage(
      this.consumerContext,
      this.queue,
      false, // blockUntilMessageReceived
      false, // autoCloseRedisConnection
    );
  }

  override next() {
    this.logger.debug(
      `MultiplexedMessageHandler.next() called for queue ${this.queue.queueParams.name}`,
    );
    this.logger.debug('Delegating to external dequeueNextFn');
    this.dequeueNextFn();
  }
}
