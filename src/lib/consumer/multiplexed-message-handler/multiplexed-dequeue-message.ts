import { DequeueMessage } from '../message-handler/dequeue-message';
import { events } from '../../../common/events/events';
import { QueueRateLimit } from '../../queue/queue-rate-limit';
import { ICallback } from 'redis-smq-common';

export class MultiplexedDequeueMessage extends DequeueMessage {
  override dequeue(): void {
    const cb: ICallback<string | null> = (err, reply) => {
      if (err) {
        this.ticker.abort();
        this.messageHandler.handleError(err);
      } else if (typeof reply === 'string') {
        this.emitReceivedMessage(reply);
      } else {
        this.messageHandler.emit(events.MESSAGE_NEXT);
      }
    };
    const deq = () => {
      if (this.isPriorityQueuingEnabled()) this.dequeueMessageWithPriority(cb);
      else this.dequeueMessage(cb);
    };
    if (this.queueRateLimit) {
      QueueRateLimit.hasExceeded(
        this.redisClient,
        this.queue,
        this.queueRateLimit,
        (err, isExceeded) => {
          if (err) this.messageHandler.handleError(err);
          else if (isExceeded) this.messageHandler.emit(events.MESSAGE_NEXT);
          else deq();
        },
      );
    } else deq();
  }
}
