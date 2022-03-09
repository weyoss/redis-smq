import { MessageHandler } from '../message-handler';
import { events } from '../../../../common/events';
import { RedisClient } from '../../../../common/redis-client/redis-client';
import {
  ICallback,
  TConsumerMessageHandler,
  TQueueParams,
} from '../../../../../../types';
import { waterfall } from '../../../../lib/async';
import { MultiplexedDequeueMessage } from './multiplexed-dequeue-message';
import { ConsumerMessageRate } from '../../consumer-message-rate';

export class MultiplexedMessageHandler extends MessageHandler {
  constructor(
    consumerId: string,
    queue: TQueueParams,
    handler: TConsumerMessageHandler,
    usePriorityQueuing: boolean,
    redisClient: RedisClient,
    messageRate: ConsumerMessageRate | null = null,
  ) {
    super(
      consumerId,
      queue,
      handler,
      usePriorityQueuing,
      redisClient,
      messageRate,
    );
    this.dequeueMessage = new MultiplexedDequeueMessage(this, redisClient);
  }

  protected override registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.removeAllListeners(events.UP);
    this.on(events.UP, () => {
      this.logger.info('Up and running...');
    });
    this.removeAllListeners(events.MESSAGE_NEXT);
    this.on(events.MESSAGE_NEXT, () => {
      if (this.powerManager.isRunning()) {
        this.emit(events.MESSAGE_MULTIPLEXER_NEXT);
      }
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
            if (this.messageRate) this.messageRate.quit(cb);
            else cb();
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
