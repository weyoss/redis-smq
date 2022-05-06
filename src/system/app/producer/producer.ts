import { ICallback, TFunction, TUnaryFunction } from '../../../../types';
import { Message } from '../message/message';
import { events } from '../../common/events';
import { PanicError } from '../../common/errors/panic.error';
import { ProducerMessageRate } from './producer-message-rate';
import { Base } from '../../common/base';
import { ProducerMessageRateWriter } from './producer-message-rate-writer';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { broker } from '../../common/broker/broker';
import { getConfiguration } from '../../common/configuration/configuration';
import { MessageError } from '../../common/errors/message.error';
import { MessageNotPublishedError } from './errors/message-not-published.error';
import { MessageNotScheduledError } from './errors/message-not-scheduled.error';

export class Producer extends Base {
  protected messageRate: ProducerMessageRate | null = null;

  constructor() {
    super();
    this.run();
  }

  protected setUpMessageRate = (cb: ICallback<void>): void => {
    const { monitor } = getConfiguration();
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
    } else cb();
  };

  protected tearDownMessageRate = (cb: ICallback<void>): void => {
    if (this.messageRate) {
      this.messageRate.quit(() => {
        this.messageRate = null;
        cb();
      });
    } else cb();
  };

  protected override goingUp(): TFunction[] {
    return super.goingUp().concat([this.setUpMessageRate]);
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [this.tearDownMessageRate].concat(super.goingDown());
  }

  protected enqueue(
    redisClient: RedisClient,
    message: Message,
    cb: ICallback<boolean>,
  ): void {
    const queue = message.getRequiredQueue();
    message.getRequiredMetadata().setPublishedAt(Date.now());
    const {
      keyQueueSettings,
      keyQueueSettingsPriorityQueuing,
      keyQueuePendingPriorityMessages,
      keyQueuePendingPriorityMessageIds,
      keyQueuePending,
    } = redisKeys.getQueueKeys(queue);
    redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keyQueueSettings,
        keyQueueSettingsPriorityQueuing,
        keyQueuePendingPriorityMessages,
        keyQueuePendingPriorityMessageIds,
        keyQueuePending,
      ],
      [
        message.getRequiredId(),
        JSON.stringify(message),
        message.getPriority() ?? '',
      ],
      (err, reply) => {
        if (err) cb(err);
        else cb(null, !!reply);
      },
    );
  }

  produce(message: Message, cb: ICallback<void>): void {
    const queue = message.getQueue();
    if (!queue) {
      cb(new MessageError('Can not publish a message without a message queue'));
    } else if (message.getMetadata()) {
      cb(
        new MessageError(
          'Can not publish a message with a metadata instance. Either you have already published the message or you have called the getSetMetadata() method.',
        ),
      );
    } else {
      const messageId = message.getSetMetadata().getId();
      const callback: ICallback<void> = (err) => {
        if (err) cb(err);
        else {
          if (this.messageRate) this.messageRate.incrementPublished(queue);
          this.emit(events.MESSAGE_PUBLISHED, message);
          cb();
        }
      };
      const proceed = () => {
        const redisClient = this.getSharedRedisClient();
        if (message.isSchedulable()) {
          broker.scheduleMessage(redisClient, message, (err, reply) => {
            if (err) callback(err);
            else if (!reply)
              callback(
                new MessageNotScheduledError(
                  `Message has not been published. Make sure that the scheduling parameters are valid.`,
                ),
              );
            else {
              this.logger.info(`Message (ID ${messageId}) has been scheduled.`);
              callback();
            }
          });
        } else {
          this.enqueue(redisClient, message, (err, reply) => {
            if (err) cb(err);
            else if (!reply)
              callback(
                new MessageNotPublishedError(
                  `Message has not been published. Make sure that the queue exists. Also note that messages with priority can only published to priority queues.`,
                ),
              );
            else {
              this.logger.info(`Message (ID ${messageId}) has been published.`);
              callback();
            }
          });
        }
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
