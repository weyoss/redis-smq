import { Message } from '../message/message';
import { events } from '../../common/events/events';
import { Base } from '../base';
import {
  async,
  RedisClient,
  ICallback,
  TUnaryFunction,
} from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { MessageNotPublishedError } from './errors/message-not-published.error';
import { MessageAlreadyPublishedError } from './errors/message-already-published.error';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { _scheduleMessage } from './_schedule-message';
import { ProducerNotRunningError } from './errors/producer-not-running.error';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../../types';
import { ExchangeDirect } from '../exchange/exchange-direct';
import { _getQueueParams } from '../queue/queue/_get-queue-params';
import { _fromMessage } from '../message/_from-message';
import { Configuration } from '../../config/configuration';

export class Producer extends Base {
  protected initProducerEventListeners = (cb: ICallback<void>): void => {
    this.registerEventListeners(
      Configuration.getSetConfig().eventListeners.producerEventListeners,
      cb,
    );
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([this.initProducerEventListeners]);
  }

  protected enqueue(
    redisClient: RedisClient,
    queue: IQueueParams,
    message: Message,
    cb: ICallback<void>,
  ): void {
    const messageState = message.getRequiredMessageState();
    messageState.setPublishedAt(Date.now());
    const messageId = message.getRequiredId();
    const {
      keyQueueProperties,
      keyPriorityQueuePending,
      keyQueuePending,
      keyQueueMessages,
    } = redisKeys.getQueueKeys(queue);
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keyQueueProperties,
        keyPriorityQueuePending,
        keyQueuePending,
        keyMessage,
      ],
      [
        EQueueProperty.QUEUE_TYPE,
        EQueueProperty.MESSAGES_COUNT,
        EQueueType.PRIORITY_QUEUE,
        EQueueType.LIFO_QUEUE,
        EQueueType.FIFO_QUEUE,
        message.getPriority() ?? '',
        keyQueueMessages, // Passing as argument. Final key will be computed dynamically
        messageId,
        EMessageProperty.STATUS,
        EMessagePropertyStatus.PENDING,
        EMessageProperty.STATE,
        JSON.stringify(messageState),
        EMessageProperty.MESSAGE,
        JSON.stringify(message.toJSON()),
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
    queue: IQueueParams,
    cb: ICallback<void>,
  ): void {
    const messageId = message
      .setDestinationQueue(queue)
      .getSetMessageState()
      .getId();
    if (message.isSchedulable())
      _scheduleMessage(redisClient, message, (err) => {
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

  produce(
    message: Message,
    cb: ICallback<{
      messages: Message[];
      scheduled: boolean;
    }>,
  ): void {
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
        if (exchange instanceof ExchangeDirect) {
          const queue = _getQueueParams(exchange.getBindingParams());
          this.produceMessage(redisClient, message, queue, (err) =>
            callback(err, [message]),
          );
        } else {
          exchange.getQueues((err, queues) => {
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
                  const msg = _fromMessage(message, null, true);
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
