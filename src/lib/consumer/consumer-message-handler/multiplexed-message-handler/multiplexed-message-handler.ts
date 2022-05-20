import { MessageHandler } from '../message-handler';
import { events } from '../../../../common/events';
import { RedisClient } from '../../../../common/redis-client/redis-client';
import {
  ICallback,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../../../types';
import { waterfall } from '../../../../util/async';
import { MultiplexedDequeueMessage } from './multiplexed-dequeue-message';

export class MultiplexedMessageHandler extends MessageHandler {
  constructor(
    consumerId: string,
    queue: TQueueParams,
    handler: TConsumerMessageHandler,
    redisClient: RedisClient,
  ) {
    super(consumerId, queue, handler, redisClient);
    this.dequeueMessage = new MultiplexedDequeueMessage(this, redisClient);
  }

  protected override registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.removeAllListeners(events.MESSAGE_NEXT);
    this.removeAllListeners(events.UP);
    this.on(events.UP, () => {
      this.logger.info('Up and running...');
    });
  }

  override shutdown(redisClient: RedisClient, cb: ICallback<void>): void {
    const goDown = () => {
      this.powerManager.goingDown();
      waterfall(
        [
          (cb: ICallback<void>) => {
            this.dequeueMessage.quit(cb);
          },
          (cb: ICallback<void>) => {
            MessageHandler.cleanUp(
              redisClient,
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
