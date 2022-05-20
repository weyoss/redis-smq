import { ICallback } from '../../../types';
import { Message } from '../message/message';
import { events } from '../../common/events';
import { PanicError } from '../../common/errors/panic.error';
import { Base } from '../../common/base';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { broker } from '../../common/broker/broker';
import { MessageError } from '../../common/errors/message.error';
import { MessageNotPublishedError } from './errors/message-not-published.error';

export class Producer extends Base {
  constructor() {
    super();
    this.run();
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
        else if (reply !== 'OK')
          cb(new MessageNotPublishedError(String(reply)));
        else cb();
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
          this.emit(events.MESSAGE_PUBLISHED, message);
          cb();
        }
      };
      const proceed = () => {
        const redisClient = this.getSharedRedisClient();
        if (message.isSchedulable()) {
          broker.scheduleMessage(redisClient, message, (err) => {
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
          cb(new PanicError(`Producer ID ${this.getId()} is not running`));
        }
      } else proceed();
    }
  }
}
