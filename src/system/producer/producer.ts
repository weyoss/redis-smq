import { ICallback, IConfig } from '../../../types';
import { Message } from '../message';
import { events } from '../common/events';
import { PanicError } from '../common/errors/panic.error';
import { ProducerMessageRate } from './producer-message-rate';
import { RedisClient } from '../common/redis-client/redis-client';
import { Base } from '../common/base';
import { ProducerMessageRateWriter } from './producer-message-rate-writer';
import { ArgumentError } from '../common/errors/argument.error';

export class Producer extends Base<ProducerMessageRate> {
  constructor(config: IConfig) {
    super(config);
    this.run();
  }

  initMessageRateInstance(redisClient: RedisClient): void {
    this.messageRate = new ProducerMessageRate();
    this.messageRateWriter = new ProducerMessageRateWriter(
      redisClient,
      this.id,
      this.messageRate,
    );
  }

  produce(message: Message, cb: ICallback<boolean>): void {
    const queue = message.getQueue();
    if (!queue) {
      cb(
        new ArgumentError('Can not publish a message without a message queue'),
      );
    } else {
      message.reset();
      const callback: ICallback<boolean> = (err, reply) => {
        if (err) cb(err);
        else {
          if (this.messageRate) this.messageRate.incrementPublished(queue);
          this.emit(events.MESSAGE_PRODUCED, message);
          cb(null, reply);
        }
      };
      const proceed = () => {
        this.getBroker((broker) => {
          if (message.isSchedulable()) {
            broker.scheduleMessage(message, callback);
          } else
            broker.enqueueMessage(message, (err) => {
              if (err) cb(err);
              else callback(null, true);
            });
        });
      };
      if (!this.powerManager.isUp()) {
        if (this.powerManager.isGoingUp()) {
          this.once(events.UP, proceed);
        } else {
          cb(new PanicError(`Producer ID ${this.getId()} is not running`));
        }
      } else proceed();
    }
  }
}
