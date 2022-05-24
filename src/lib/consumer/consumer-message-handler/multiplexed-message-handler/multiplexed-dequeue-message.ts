import { DequeueMessage } from '../dequeue-message';
import { Message } from '../../../message/message';
import { events } from '../../../../common/events/events';
import { QueueRateLimit } from '../../../queue-manager/queue-rate-limit';
import { ICallback } from 'redis-smq-common/dist/types';

export class MultiplexedDequeueMessage extends DequeueMessage {
  override dequeue(): void {
    const cb: ICallback<string> = (err, reply) => {
      if (err) {
        this.ticker.abort();
        this.messageHandler.handleError(err);
      } else if (typeof reply === 'string') {
        const message = Message.createFromMessage(reply);
        this.messageHandler.emit(events.MESSAGE_RECEIVED, message);
      } else {
        this.messageHandler.emit(events.MESSAGE_NEXT);
      }
    };
    const deq = () => {
      if (this.priorityQueuing) this.dequeueMessageWithPriority(cb);
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
