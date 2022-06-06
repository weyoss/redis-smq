import { MessageHandler } from '../message-handler';
import { events } from '../../../../common/events/events';
import { TConsumerMessageHandler, TQueueParams } from '../../../../../types';
import { MultiplexedDequeueMessage } from './multiplexed-dequeue-message';
import { Consumer } from '../../consumer';
import { async, RedisClient } from 'redis-smq-common';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class MultiplexedMessageHandler extends MessageHandler {
  constructor(
    consumer: Consumer,
    queue: TQueueParams,
    handler: TConsumerMessageHandler,
    dequeueRedisClient: RedisClient,
    sharedRedisClient: RedisClient,
    logger: ICompatibleLogger,
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

  override shutdown(cb: ICallback<void>): void {
    const goDown = () => {
      this.powerManager.goingDown();
      async.waterfall(
        [
          (cb: ICallback<void>) => this.dequeueMessage.quit(cb),
          (cb: ICallback<void>) => this.tearDownPlugins(cb),
          (cb: ICallback<void>) => this.cleanUp(cb),
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
