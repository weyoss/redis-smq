import { MessageHandler } from '../message-handler/message-handler';
import { events } from '../../../common/events/events';
import {
  EConsumeMessageUnacknowledgedCause,
  TConsumerMessageHandler,
  IQueueParams,
} from '../../../../types';
import { MultiplexedDequeueMessage } from './multiplexed-dequeue-message';
import { Consumer } from '../consumer';
import { async, RedisClient, ICallback, ILogger } from 'redis-smq-common';

export class MultiplexedMessageHandler extends MessageHandler {
  constructor(
    consumer: Consumer,
    queue: IQueueParams,
    handler: TConsumerMessageHandler,
    dequeueRedisClient: RedisClient,
    sharedRedisClient: RedisClient,
    logger: ILogger,
  ) {
    super(
      consumer,
      queue,
      handler,
      dequeueRedisClient,
      sharedRedisClient,
      logger,
    );
    this.dequeueMessage = new MultiplexedDequeueMessage(
      this,
      dequeueRedisClient,
    );
  }

  protected override registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.removeAllListeners(events.MESSAGE_NEXT);
    this.removeAllListeners(events.UP);
    this.on(events.UP, () => {
      this.logger.info('Up and running...');
    });
  }

  override shutdown(
    messageUnacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const goDown = () => {
      this.powerManager.goingDown();
      async.waterfall(
        [
          (cb: ICallback<void>) => this.dequeueMessage.quit(cb),
          (cb: ICallback<void>) => this.cleanUp(messageUnacknowledgedCause, cb),
        ],
        (err) => {
          if (err) cb(err);
          else {
            this.powerManager.commit();
            this.emit(events.DOWN);
            cb();
          }
        },
      );
    };
    if (this.powerManager.isGoingUp()) this.once(events.UP, goDown);
    else goDown();
  }
}