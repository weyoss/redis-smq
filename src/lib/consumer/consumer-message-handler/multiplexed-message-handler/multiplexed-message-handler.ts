import { MessageHandler } from '../message-handler';
import { events } from '../../../../common/events';
import { RedisClient } from '../../../../common/redis-client/redis-client';
import {
  ICallback,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../../../types';
import { each, waterfall } from '../../../../util/async';
import { MultiplexedDequeueMessage } from './multiplexed-dequeue-message';
import { Consumer } from '../../consumer';

export class MultiplexedMessageHandler extends MessageHandler {
  constructor(
    consumer: Consumer,
    queue: TQueueParams,
    handler: TConsumerMessageHandler,
    dequeueRedisClient: RedisClient,
    sharedRedisClient: RedisClient,
  ) {
    super(consumer, queue, handler, dequeueRedisClient, sharedRedisClient);
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
      waterfall(
        [
          (cb: ICallback<void>) => {
            this.dequeueMessage.quit(cb);
          },
          (cb: ICallback<void>) => {
            each(
              this.plugins,
              (plugin, index, done) => plugin.quit(done),
              (err) => {
                if (err) cb(err);
                else {
                  this.plugins = [];
                  cb();
                }
              },
            );
          },
          (cb: ICallback<void>) => {
            MessageHandler.cleanUp(
              this.sharedRedisClient,
              this.consumerId,
              this.queue,
              undefined,
              cb,
            );
          },
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
