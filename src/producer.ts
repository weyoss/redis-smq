import { IConfig, TCallback } from '../types';
import { Message } from './message';
import { ProducerStatsProvider } from './stats-provider/producer-stats-provider';
import { Instance } from './instance';
import { ProducerRedisKeys } from './redis-keys/producer-redis-keys';
import { events } from './events';

export class Producer extends Instance {
  protected statsProvider: ProducerStatsProvider | null = null;

  constructor(queueName: string, config: IConfig = {}) {
    super(queueName, config);
    this.redisKeys = new ProducerRedisKeys(this.getQueueName(), this.getId());
    this.run();
  }

  protected registerEventsHandlers(): void {
    super.registerEventsHandlers();
    this.on(events.DOWN, () => {
      this.statsProvider = null;
    });
  }

  protected getStatsProvider(): ProducerStatsProvider {
    if (!this.statsProvider) {
      this.statsProvider = new ProducerStatsProvider(this);
    }
    return this.statsProvider;
  }

  produceMessage(msg: unknown, cb: TCallback<void>): void {
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    const onProduced = () => {
      this.emit(events.MESSAGE_PRODUCED, message);
      cb();
    };
    const proceed = () => {
      const scheduler = this.getScheduler();
      if (scheduler.isSchedulable(message)) {
        scheduler.schedule(message, onProduced);
      } else {
        const { keyQueue } = this.getInstanceRedisKeys();
        this.getRedisInstance().lpush(
          keyQueue,
          message.toString(),
          (err?: Error | null) => {
            if (err) cb(err);
            else {
              if (this.statsProvider) this.statsProvider.incrementInputSlot();
              cb();
            }
          },
        );
      }
    };
    if (!this.powerManager.isUp()) {
      if (this.isBootstrapping() || this.powerManager.isGoingUp())
        this.once(events.UP, proceed);
      else this.error(new Error(`Producer ID ${this.getId()} is not running`));
    } else proceed();
  }
}
