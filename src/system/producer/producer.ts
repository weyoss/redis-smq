import {
  IConfig,
  ICallback,
  TProducerRedisKeys,
  THeartbeatRegistryPayload,
  TQueueParams,
} from '../../../types';
import { Message } from '../message';
import { ProducerMessageRate } from './producer-message-rate';
import { events } from '../common/events';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { RedisClient } from '../redis-client/redis-client';
import { PanicError } from '../common/errors/panic.error';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import { heartbeatRegistry } from '../common/heartbeat/heartbeat-registry';
import { ExtendedBase } from '../extended-base';
import { ProducerMessageRateWriter } from './producer-message-rate-writer';

export class Producer extends ExtendedBase<
  ProducerMessageRate,
  TProducerRedisKeys
> {
  constructor(queueName: string, config: IConfig = {}) {
    super(queueName, config);
    this.run();
  }

  initMessageRateInstance(redisClient: RedisClient): void {
    this.messageRate = new ProducerMessageRate();
    this.messageRateWriter = new ProducerMessageRateWriter(
      redisClient,
      this.queue,
      this.id,
      this.messageRate,
    );
  }

  initHeartbeatInstance(redisClient: RedisClient): void {
    const { keyHeartbeatProducer, keyQueueProducers } = this.getRedisKeys();
    const heartbeat = new Heartbeat(
      {
        keyHeartbeat: keyHeartbeatProducer,
        keyInstanceRegistry: keyQueueProducers,
        instanceId: this.getId(),
      },
      redisClient,
    );
    heartbeat.on(events.ERROR, (err: Error) => this.emit(events.ERROR, err));
    this.heartbeat = heartbeat;
  }

  produce(msg: unknown, cb: ICallback<boolean>): void {
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    message.reset();
    message.setQueue(this.queue);
    const callback: ICallback<boolean> = (err, reply) => {
      if (err) cb(err);
      else {
        if (this.messageRate) this.messageRate.incrementPublished();
        this.emit(events.MESSAGE_PRODUCED, message);
        cb(null, reply);
      }
    };
    const proceed = () => {
      this.getBroker((broker) => {
        if (message.isSchedulable()) {
          broker.scheduleMessage(message, callback);
        } else {
          broker.enqueueMessage(message, (err?: Error | null) => {
            if (err) callback(err);
            else callback(null, true);
          });
        }
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

  getRedisKeys(): TProducerRedisKeys {
    if (!this.redisKeys) {
      this.redisKeys = redisKeys.getProducerKeys(
        this.queue.name,
        this.id,
        this.queue.ns,
      );
    }
    return this.redisKeys;
  }

  static isAlive(
    redisClient: RedisClient,
    queueName: string,
    id: string,
    cb: ICallback<boolean>,
  ): void {
    const { keyQueueProducers } = redisKeys.getProducerKeys(queueName, id);
    heartbeatRegistry.exists(redisClient, keyQueueProducers, id, cb);
  }

  static getOnlineProducers(
    redisClient: RedisClient,
    queue: TQueueParams,
    transform = false,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    const { keyQueueProducers } = redisKeys.getKeys(queue.name, queue.ns);
    heartbeatRegistry.getAll(redisClient, keyQueueProducers, transform, cb);
  }

  static countOnlineProducers(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<number>,
  ): void {
    const { keyQueueProducers } = redisKeys.getKeys(queue.name, queue.ns);
    heartbeatRegistry.count(redisClient, keyQueueProducers, cb);
  }
}
