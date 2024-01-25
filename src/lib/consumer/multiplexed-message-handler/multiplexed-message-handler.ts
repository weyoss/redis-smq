/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageHandler } from '../message-handler/message-handler';
import { ICallback, ILogger, RedisClient } from 'redis-smq-common';
import { Consumer } from '../consumer';
import { IConsumerMessageHandlerArgs } from '../../../../types';

export class MultiplexedMessageHandler extends MessageHandler {
  constructor(
    consumer: Consumer,
    handlerParams: IConsumerMessageHandlerArgs,
    dequeueRedisClient: RedisClient,
    sharedRedisClient: RedisClient,
    logger: ILogger,
  ) {
    super(
      consumer,
      handlerParams,
      dequeueRedisClient,
      sharedRedisClient,
      logger,
    );
    this.dequeueMessage.disableConnectionBlocking();
  }

  protected override registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.removeAllListeners('next');
    this.removeAllListeners('up');
    this.on('up', () => {
      this.logger.info('Up and running...');
    });
  }
  protected override shutdownDequeueClient(cb: ICallback<void>) {
    cb();
  }
}
