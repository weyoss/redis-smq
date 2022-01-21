import { ICallback, IConfig, TFunction, TUnaryFunction } from '../../../types';
import { Message } from '../message';
import { events } from '../common/events';
import { PanicError } from '../common/errors/panic.error';
import { ProducerMessageRate } from './producer-message-rate';
import { Base } from '../common/base';
import { ProducerMessageRateWriter } from './producer-message-rate-writer';
import { ArgumentError } from '../common/errors/argument.error';

export class Producer extends Base {
  protected messageRate: ProducerMessageRate | null = null;

  constructor(config: IConfig) {
    super(config);
    this.run();
  }

  protected setUpMessageRate = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up MessageRate...`);
    const { monitor } = this.config;
    if (monitor && monitor.enabled) {
      if (!this.sharedRedisClient)
        cb(new PanicError(`Expected an instance of RedisClient`));
      else {
        const messageRateWriter = new ProducerMessageRateWriter(
          this.sharedRedisClient,
        );
        this.messageRate = new ProducerMessageRate(messageRateWriter);
        cb();
      }
    } else {
      this.logger.debug(`Skipping MessageRate setup as monitor not enabled...`);
      cb();
    }
  };

  protected tearDownMessageRate = (cb: ICallback<void>): void => {
    this.logger.debug(`Tear down MessageRate...`);
    if (this.messageRate) {
      this.messageRate.quit(() => {
        this.logger.debug(`MessageRate has been torn down.`);
        this.messageRate = null;
        cb();
      });
    } else cb();
  };

  protected goingUp(): TFunction[] {
    return super.goingUp().concat([this.setUpMessageRate]);
  }

  protected goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [this.tearDownMessageRate].concat(super.goingDown());
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
