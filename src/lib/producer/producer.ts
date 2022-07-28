import { Message } from '../message/message';
import { events } from '../../common/events/events';
import { Base } from '../base';
import { RedisClient, errors } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { MessageNotPublishedError } from './errors/message-not-published.error';
import { MessageQueueRequiredError } from './errors/message-queue-required.error';
import { MessageAlreadyPublishedError } from './errors/message-already-published.error';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { ICallback, TUnaryFunction } from 'redis-smq-common/dist/types';
import { scheduleMessage } from './schedule-message';
import { Queue } from '../queue-manager/queue';

export class Producer extends Base {
  protected initProducerEventListeners = (cb: ICallback<void>): void => {
    this.registerEventListeners(
      this.config.eventListeners.producerEventListeners,
      cb,
    );
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([this.initProducerEventListeners]);
  }

  protected enqueue(
    redisClient: RedisClient,
    message: Message,
    cb: ICallback<void>,
  ): void {
    const queue = message.getRequiredQueue();
    message.getRequiredMetadata().setPublishedAt(Date.now());
    const {
      keyQueueSettings,
      keyQueueSettingsPriorityQueuing,
      keyQueuePendingPriorityMessages,
      keyQueuePendingPriorityMessageWeight,
      keyQueuePending,
    } = redisKeys.getQueueKeys(queue);
    redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keyQueueSettings,
        keyQueueSettingsPriorityQueuing,
        keyQueuePendingPriorityMessages,
        keyQueuePendingPriorityMessageWeight,
        keyQueuePending,
      ],
      [
        message.getRequiredId(),
        JSON.stringify(message),
        message.getPriority() ?? '',
      ],
      (err, reply) => {
        if (err) cb(err);
        else if (reply !== 'OK')
          cb(new MessageNotPublishedError(String(reply)));
        else cb();
      },
    );
  }

  produce(message: Message, cb: ICallback<void>): void {
    const queue = message.getQueue();
    if (!queue) {
      cb(new MessageQueueRequiredError());
    } else if (message.getMetadata()) {
      cb(new MessageAlreadyPublishedError());
    } else {
      if (!this.powerManager.isUp())
        cb(
          new errors.PanicError(
            `Producer ID ${this.getId()} is not running. Before producing messages you need to run your producer instance.`,
          ),
        );
      else {
        const queueParams = Queue.getParams(this.config, queue);
        message.setQueue(queueParams);
        const messageId = message.getSetMetadata().getId();
        const callback: ICallback<void> = (err) => {
          if (err) cb(err);
          else {
            this.emit(events.MESSAGE_PUBLISHED, message);
            cb();
          }
        };
        const redisClient = this.getSharedRedisClient();
        if (message.isSchedulable()) {
          scheduleMessage(redisClient, message, (err) => {
            if (err) callback(err);
            else {
              this.logger.info(`Message (ID ${messageId}) has been scheduled.`);
              callback();
            }
          });
        } else {
          this.enqueue(redisClient, message, (err) => {
            if (err) callback(err);
            else {
              this.logger.info(`Message (ID ${messageId}) has been published.`);
              callback();
            }
          });
        }
      }
    }
  }
}
