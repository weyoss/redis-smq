import { IConfig, IPlugin } from '../../../types';
import { Message } from '../message/message';
import { events } from '../../common/events/events';
import { Base } from '../base';
import { RedisClient, errors, async } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { MessageNotPublishedError } from './errors/message-not-published.error';
import { getProducerPlugins } from '../../plugins/plugins';
import { MessageQueueRequiredError } from './errors/message-queue-required.error';
import { MessageAlreadyPublishedError } from './errors/message-already-published.error';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { ICallback, TUnaryFunction } from 'redis-smq-common/dist/types';
import { scheduleMessage } from '../broker/schedule-message';
import { Queue } from '../queue-manager/queue';

export class Producer extends Base {
  protected plugins: IPlugin[] = [];

  constructor(config: IConfig = {}) {
    super(config);
    this.run();
  }

  protected initPlugins = (cb: ICallback<void>): void => {
    const sharedRedisClient = this.getSharedRedisClient();
    getProducerPlugins().forEach((ctor) =>
      this.plugins.push(new ctor(sharedRedisClient, this)),
    );
    cb();
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([this.initPlugins]);
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [
      (cb: ICallback<void>): void =>
        async.each(
          this.plugins,
          (plugin, idx, done) => plugin.quit(done),
          (err) => {
            if (err) cb(err);
            else {
              this.plugins = [];
              cb();
            }
          },
        ),
    ].concat(super.goingDown());
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
      const proceed = () => {
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
      };
      if (!this.powerManager.isUp()) {
        if (this.powerManager.isGoingUp()) {
          this.once(events.UP, proceed);
        } else {
          cb(
            new errors.PanicError(`Producer ID ${this.getId()} is not running`),
          );
        }
      } else proceed();
    }
  }
}
