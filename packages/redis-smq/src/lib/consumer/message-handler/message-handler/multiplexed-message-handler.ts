/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisClient } from '../../../../common/redis-client/redis-client.js';
import { EventBus } from '../../../../common/event-bus/event-bus.js';
import { Consumer } from '../../consumer/consumer.js';
import { IConsumerMessageHandlerArgs } from '../../types/index.js';
import { DequeueMessage } from './dequeue-message/dequeue-message.js';
import { MessageHandler } from './message-handler.js';

export class MultiplexedMessageHandler extends MessageHandler {
  protected dequeueNextFn;

  constructor(
    consumer: Consumer,
    redisClient: RedisClient,
    handlerParams: IConsumerMessageHandlerArgs,
    eventBus: EventBus | null,
    dequeueNextFn: () => void,
  ) {
    super(consumer, redisClient, handlerParams, false, eventBus);
    this.dequeueNextFn = dequeueNextFn;
    this.logger.info(
      `MultiplexedMessageHandler initialized for consumer ${this.consumerId}, queue ${this.queue.queueParams.name}`,
    );
    this.logger.debug('Auto-dequeue disabled for multiplexed handler');
  }

  protected override initDequeueMessageInstance(): DequeueMessage {
    this.logger.debug(
      'Creating DequeueMessage instance for multiplexed handler',
    );
    this.logger.debug(
      'Setting blockUntilMessageReceived=false and autoCloseRedisConnection=false',
    );

    const instance = new DequeueMessage(
      this.redisClient,
      this.queue,
      this.consumer,
      this.eventBus,
      false, // blockUntilMessageReceived
      false, // autoCloseRedisConnection
    );

    this.logger.debug('Setting up error handler for DequeueMessage instance');
    instance.on('consumer.dequeueMessage.error', this.onError);

    this.logger.debug(
      'DequeueMessage instance created successfully for multiplexed handler',
    );
    return instance;
  }

  override next() {
    this.logger.debug(
      `MultiplexedMessageHandler.next() called for queue ${this.queue.queueParams.name}`,
    );
    this.logger.debug('Delegating to external dequeueNextFn');
    this.dequeueNextFn();
  }
}
