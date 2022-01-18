import {
  ICallback,
  IConfig,
  THeartbeatRegistryPayload,
  TQueueParams,
} from '../../../types';
import { Message } from '../message';
import { events } from '../common/events';
import { PanicError } from '../common/errors/panic.error';
import { MultiQueueProducerMessageRate } from './multi-queue-producer-message-rate';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { RedisClient } from '../common/redis-client/redis-client';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import { Base } from '../common/base';
import { heartbeatRegistry } from '../common/heartbeat/heartbeat-registry';
import { MultiQueueProducerMessageRateWriter } from './multi-queue-producer-message-rate-writer';
import { ELuaScriptName } from '../common/redis-client/lua-scripts';

export class MultiQueueProducer extends Base<MultiQueueProducerMessageRate> {
  constructor(config: IConfig) {
    super(config);
    this.run();
  }

  initMessageRateInstance(redisClient: RedisClient): void {
    this.messageRate = new MultiQueueProducerMessageRate();
    this.messageRateWriter = new MultiQueueProducerMessageRateWriter(
      redisClient,
      this.id,
      this.messageRate,
    );
  }

  initHeartbeatInstance(redisClient: RedisClient): void {
    const { keyHeartbeatMultiQueueProducer, keyMultiQueueProducers } =
      redisKeys.getMultiQueueProducerKeys(this.getId());
    this.heartbeat = new Heartbeat(
      {
        keyHeartbeat: keyHeartbeatMultiQueueProducer,
        keyInstanceRegistry: keyMultiQueueProducers,
        instanceId: this.getId(),
      },
      redisClient,
    );
    this.heartbeat.on(events.ERROR, (err: Error) =>
      this.emit(events.ERROR, err),
    );
  }

  produce(queueName: string, msg: unknown, cb: ICallback<boolean>): void {
    const queue: TQueueParams = {
      name: queueName,
      ns: redisKeys.getNamespace(),
    };
    const message = !(msg instanceof Message)
      ? new Message().setBody(msg)
      : msg;
    message.reset();
    message.setQueue(queue);
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
        } else {
          this.getSharedRedisClient((client) => {
            const {
              keyQueues,
              keyQueuePendingWithPriority,
              keyQueuePriority,
              keyQueuePending,
            } = redisKeys.getKeys(queueName);
            client.runScript(
              ELuaScriptName.PUBLISH_MESSAGE,
              [
                keyQueues,
                JSON.stringify(queue),
                message.getId(),
                JSON.stringify(message),
                message.getPriority() ?? '',
                keyQueuePendingWithPriority,
                keyQueuePriority,
                keyQueuePending,
              ],
              (err) => {
                if (err) cb(err);
                else cb(null, true);
              },
            );
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

  static countOnlineProducers(
    redisClient: RedisClient,
    cb: ICallback<number>,
  ): void {
    const { keyMultiQueueProducers } = redisKeys.getGlobalKeys();
    heartbeatRegistry.count(redisClient, keyMultiQueueProducers, cb);
  }

  static getOnlineProducers(
    redisClient: RedisClient,
    transform = false,
    cb: ICallback<Record<string, THeartbeatRegistryPayload | string>>,
  ): void {
    const { keyMultiQueueProducers } = redisKeys.getGlobalKeys();
    heartbeatRegistry.getAll(
      redisClient,
      keyMultiQueueProducers,
      transform,
      cb,
    );
  }
}
