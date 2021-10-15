import { IConfig, ICallback } from '../types';
import { Message } from './message';
import { ProducerStatsProvider } from './system/stats-provider/producer-stats-provider';
import { Instance } from './system/instance';
import { events } from './system/events';

export class Producer extends Instance {
  protected statsProvider: ProducerStatsProvider | null = null;

  constructor(queueName: string, config: IConfig = {}) {
    super(queueName, config);
    this.run();
  }

  getStatsProvider(): ProducerStatsProvider {
    if (!this.statsProvider) {
      this.statsProvider = new ProducerStatsProvider(this);
    }
    return this.statsProvider;
  }

  produceMessage(msg: unknown, cb: ICallback<boolean>): void {
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    const callback: ICallback<boolean> = (err, reply) => {
      if (err) cb(err);
      else {
        if (this.statsProvider) this.statsProvider.incrementInputSlot();
        this.emit(events.MESSAGE_PRODUCED, message);
        cb(null, reply);
      }
    };
    const proceed = () => {
      this.getScheduler((err, scheduler) => {
        if (err) cb(err);
        else if (!scheduler) cb(new Error(`Expected an instance of Scheduler`));
        else {
          if (scheduler.isSchedulable(message)) {
            scheduler.schedule(message, callback);
          } else {
            this.getCommonRedisClient((client) => {
              this.getBroker((broker) => {
                broker.enqueueMessage(message, client, (err?: Error | null) => {
                  if (err) callback(err);
                  else callback(null, true);
                });
              });
            });
          }
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
