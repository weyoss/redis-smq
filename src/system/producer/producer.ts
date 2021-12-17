import {
  IConfig,
  ICallback,
  TProducerRedisKeys,
  THeartbeatRegistryPayload,
} from '../../../types';
import { Message } from '../message';
import { ProducerMessageRate } from './producer-message-rate/producer-message-rate';
import { Base } from '../base';
import { events } from '../common/events';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { RedisClient } from '../redis-client/redis-client';
import { PanicError } from '../common/errors/panic.error';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import { heartbeatRegistry } from '../common/heartbeat/heartbeat-registry';

export class Producer extends Base<ProducerMessageRate, TProducerRedisKeys> {
  constructor(queueName: string, config: IConfig = {}) {
    super(queueName, config);
    this.run();
  }

  getMessageRate(redisClient: RedisClient): ProducerMessageRate {
    if (!this.messageRate) {
      this.messageRate = new ProducerMessageRate(this, redisClient);
    }
    return this.messageRate;
  }

  produceMessage(msg: unknown, cb: ICallback<boolean>): void {
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    message.reset();
    message.setQueue(redisKeys.getNamespace(), this.queueName);
    const callback: ICallback<boolean> = (err, reply) => {
      if (err) cb(err);
      else {
        if (this.messageRate) this.messageRate.incrementInputSlot();
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
      this.redisKeys = redisKeys.getProducerKeys(this.queueName, this.id);
    }
    return this.redisKeys;
  }

  getHeartbeat(redisClient: RedisClient): Heartbeat {
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
    return heartbeat;
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
    queueName: string,
    ns: string | undefined,
    transform = false,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    const { keyQueueProducers } = redisKeys.getKeys(queueName, ns);
    heartbeatRegistry.getAll(redisClient, keyQueueProducers, transform, cb);
  }

  static countOnlineProducers(
    redisClient: RedisClient,
    queueName: string,
    ns: string | undefined,
    cb: ICallback<number>,
  ): void {
    const { keyQueueProducers } = redisKeys.getKeys(queueName, ns);
    heartbeatRegistry.count(redisClient, keyQueueProducers, cb);
  }
}
