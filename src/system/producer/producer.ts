import { IConfig, ICallback } from '../../../types';
import { Message } from '../message';
import { ProducerRatesProvider } from './producer-rates-provider';
import { Base } from '../base';
import { events } from '../common/events';

export class Producer extends Base {
  protected statsProvider: ProducerRatesProvider | null = null;

  constructor(queueName: string, config: IConfig = {}) {
    super(queueName, config);
    this.run();
  }

  getStatsProvider(): ProducerRatesProvider {
    if (!this.statsProvider) {
      this.statsProvider = new ProducerRatesProvider(this);
    }
    return this.statsProvider;
  }

  produceMessage(msg: unknown, cb: ICallback<boolean>): void {
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    message.setQueue(this.queueName);
    const callback: ICallback<boolean> = (err, reply) => {
      if (err) cb(err);
      else {
        if (this.statsProvider) this.statsProvider.incrementInputSlot();
        this.emit(events.MESSAGE_PRODUCED, message);
        cb(null, reply);
      }
    };
    const proceed = () => {
      this.getBroker((broker) => {
        if (message.isSchedulable()) {
          broker.scheduleMessage(message, callback);
        } else {
          broker.enqueueMessage(
            this.queueName,
            message,
            (err?: Error | null) => {
              if (err) callback(err);
              else callback(null, true);
            },
          );
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
