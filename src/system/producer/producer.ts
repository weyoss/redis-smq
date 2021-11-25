import { IConfig, ICallback } from '../../../types';
import { Message } from '../message';
import { ProducerMessageRate } from './producer-message-rate';
import { Base } from '../base';
import { events } from '../common/events';
import { redisKeys } from '../common/redis-keys';
import { RedisClient } from '../redis-client/redis-client';

export class Producer extends Base<ProducerMessageRate> {
  constructor(queueName: string, config: IConfig = {}) {
    super(queueName, config);
    this.run();
  }

  getMessageRate(redisClient: RedisClient): ProducerMessageRate {
    if (!this.messageRate) {
      this.messageRate = new ProducerMessageRate(this, redisClient);
    }
    return this.messageRate;
  }

  produceMessage(msg: unknown, cb: ICallback<boolean>): void {
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    message.reset();
    message.setQueue(redisKeys.getNamespace(), this.queueName);
    const callback: ICallback<boolean> = (err, reply) => {
      if (err) cb(err);
      else {
        if (this.messageRate) this.messageRate.incrementInputSlot();
        this.emit(events.MESSAGE_PRODUCED, message);
        cb(null, reply);
      }
    };
    const proceed = () => {
      this.getBroker((broker) => {
        if (message.isSchedulable()) {
          broker.scheduleMessage(message, callback);
        } else {
          broker.enqueueMessage(message, (err?: Error | null) => {
            if (err) callback(err);
            else callback(null, true);
          });
        }
      });
    };
    if (!this.powerManager.isUp()) {
      if (this.powerManager.isGoingUp()) {
        this.once(events.UP, proceed);
      } else {
        cb(new Error(`Producer ID ${this.getId()} is not running`));
      }
    } else proceed();
  }
}
