/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILogger } from 'redis-smq-common';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { EventBus } from '../../event-bus/index.js';
import { Consumer } from '../consumer/consumer.js';
import { IConsumerMessageHandlerArgs } from '../types/index.js';
import { DequeueMessage } from './dequeue-message/dequeue-message.js';
import { MessageHandler } from './message-handler/message-handler.js';

export class MultiplexedMessageHandler extends MessageHandler {
  protected dequeueNextFn;

  constructor(
    consumer: Consumer,
    redisClient: RedisClient,
    logger: ILogger,
    handlerParams: IConsumerMessageHandlerArgs,
    eventBus: EventBus | null,
    dequeueNextFn: () => void,
  ) {
    super(consumer, redisClient, logger, handlerParams, false, eventBus);
    this.dequeueNextFn = dequeueNextFn;
  }

  protected override initDequeueMessageInstance(): DequeueMessage {
    const instance = new DequeueMessage(
      this.redisClient,
      this.queue,
      this.consumer,
      this.logger,
      this.eventBus,
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
