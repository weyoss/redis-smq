import { DequeueMessage } from '../dequeue-message';
import { ICallback } from '../../../../../../types';
import { Message } from '../../../message/message';
import { events } from '../../../../common/events';
import { queueManager } from '../../../queue-manager/queue-manager';

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
      if (this.queue.priorityQueuing) this.dequeueMessageWithPriority(cb);
      else this.dequeueMessage(cb);
    };
    if (this.queueRateLimit) {
      queueManager.hasQueueRateLimitExceeded(
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
