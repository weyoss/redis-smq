import { Message } from '../message/message';
import { events } from '../../common/events/events';
import { Base } from '../base';
import { async, RedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { MessageNotPublishedError } from './errors/message-not-published.error';
import { MessageAlreadyPublishedError } from './errors/message-already-published.error';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { ICallback, TUnaryFunction } from 'redis-smq-common/dist/types';
import { scheduleMessage } from './schedule-message';
import { ProducerNotRunningError } from './errors/producer-not-running.error';
import { TProduceMessageReply, TQueueParams } from '../../../types';
import { DirectExchange } from '../exchange/direct-exchange';
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
    queue: TQueueParams,
    message: Message,
    cb: ICallback<void>,
  ): void {
    message.getRequiredMessageState().setPublishedAt(Date.now());
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

  protected produceMessage(
    redisClient: RedisClient,
    message: Message,
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void {
    const messageId = message
      .setDestinationQueue(queue)
      .getSetMessageState()
      .getId();
    if (message.isSchedulable())
      scheduleMessage(redisClient, message, (err) => {
        if (err) cb(err);
        else {
          this.logger.info(`Message (ID ${messageId}) has been scheduled.`);
          cb();
        }
      });
    else
      this.enqueue(redisClient, queue, message, (err) => {
        if (err) cb(err);
        else {
          this.logger.info(`Message (ID ${messageId}) has been published.`);
          this.emit(events.MESSAGE_PUBLISHED, message);
          cb();
        }
      });
  }

  produce(message: Message, cb: ICallback<TProduceMessageReply>): void {
    if (!this.powerManager.isUp()) cb(new ProducerNotRunningError());
    else {
      if (message.getMessageState()) cb(new MessageAlreadyPublishedError());
      else {
        const callback: ICallback<Message[]> = (err, messages = []) => {
          if (err) cb(err);
          else cb(null, { scheduled: false, messages });
        };
        const redisClient = this.getSharedRedisClient();
        const exchange = message.getRequiredExchange();
        if (exchange instanceof DirectExchange) {
          const queue = Queue.getParams(
            this.config,
            exchange.getBindingParams(),
          );
          this.produceMessage(redisClient, message, queue, (err) =>
            callback(err, [message]),
          );
        } else {
          exchange.getQueues(redisClient, this.config, (err, queues) => {
            if (err) cb(err);
            else if (!queues?.length)
              cb(
                new MessageNotPublishedError(
                  `The exchange (${exchange.constructor.name}) does not match any queue.`,
                ),
              );
            else {
              const messages: Message[] = [];
              async.eachOf(
                queues,
                (queue, index, done) => {
                  const msg = Message.createFromMessage(message, true);
                  this.produceMessage(redisClient, msg, queue, (err) => {
                    if (err) done(err);
                    else {
                      messages.push(msg);
                      done();
                    }
                  });
                },
                (err) => callback(err, messages),
              );
            }
          });
        }
      }
    }
  }
}
