/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { Consumer } from '../consumer/consumer.js';
import { DequeueMessage } from './dequeue-message/dequeue-message.js';
import { MessageHandler } from './message-handler/message-handler.js';
import { IConsumerMessageHandlerArgs } from '../types/index.js';

export class MultiplexedMessageHandler extends MessageHandler {
  protected dequeueNextFn;

  constructor(
    consumer: Consumer,
    handlerParams: IConsumerMessageHandlerArgs,
    logger: ILogger,
    dequeueNextFn: () => void,
  ) {
    super(consumer, logger, handlerParams, false);
    this.dequeueNextFn = dequeueNextFn;
  }

  protected override initDequeueMessageInstance(): DequeueMessage {
    const instance = new DequeueMessage(
      this.redisClient,
      this.queue,
      this.consumerId,
      this.logger,
      false,
      false,
    );
    instance.on('consumer.dequeueMessage.error', this.onError);
    return instance;
  }

  override next() {
    this.dequeueNextFn();
  }
}
