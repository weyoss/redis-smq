import { ICallback, IConfig, TQueueParams } from '../../../types';
import { Message } from '../message';
import { events } from '../common/events';
import { PanicError } from '../common/errors/panic.error';
import { MultiQueueProducerMessageRate } from './multi-queue-producer-message-rate';
import { redisKeys } from '../common/redis-keys/redis-keys';
import { RedisClient } from '../redis-client/redis-client';
import { Heartbeat } from '../common/heartbeat/heartbeat';
import { QueueManager } from '../queue-manager/queue-manager';
import { Base } from '../base';

export class MultiQueueProducer extends Base<MultiQueueProducerMessageRate> {
  protected queues = new Set<string>();

  constructor(config: IConfig) {
    super(config);
    this.run();
  }

  initMessageRateInstance(redisClient: RedisClient, cb: ICallback<void>): void {
    this.messageRate = new MultiQueueProducerMessageRate(
      this.getId(),
      redisClient,
    );
    cb();
  }

  initHeartbeatInstance(redisClient: RedisClient, cb: ICallback<void>): void {
    const { keyHeartbeatMultiQueueProducer, keyMultiQueueProducers } =
      redisKeys.getMultiQueueProducerKeys(this.getId());
    const heartbeat = new Heartbeat(
      {
        keyHeartbeat: keyHeartbeatMultiQueueProducer,
        keyInstanceRegistry: keyMultiQueueProducers,
        instanceId: this.getId(),
      },
      redisClient,
    );
    heartbeat.on(events.ERROR, (err: Error) => this.emit(events.ERROR, err));
    this.heartbeat = heartbeat;
    cb();
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
          broker.enqueueMessage(message, (err?: Error | null) => {
            if (err) callback(err);
            else callback(null, true);
          });
        }
      });
    };
    const setUpQueue = (): void => {
      const queueId = `${queue.ns}:${queue.name}`;
      if (!this.queues.has(queueId)) {
        this.getSharedRedisClient((redisClient) => {
          QueueManager.setUpMessageQueue(queue, redisClient, (err) => {
            if (err) cb(err);
            else {
              this.queues.add(queueId);
              proceed();
            }
          });
        });
      } else proceed();
    };
    if (!this.powerManager.isUp()) {
      if (this.powerManager.isGoingUp()) {
        this.once(events.UP, setUpQueue);
      } else {
        cb(new PanicError(`Producer ID ${this.getId()} is not running`));
      }
    } else setUpQueue();
  }
}
