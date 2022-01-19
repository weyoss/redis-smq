import { IConfig, ICallback, TFunction, TQueueParams } from '../../../types';
import { MessageRate } from './message-rate';
import { QueueManager } from '../queue-manager/queue-manager';
import { PanicError } from './errors/panic.error';
import { Base } from './base';
import { RedisClient } from './redis-client/redis-client';
import { EmptyCallbackReplyError } from './errors/empty-callback-reply.error';
import { Heartbeat } from './heartbeat/heartbeat';
import { events } from './events';

export abstract class ExtendedBase<
  TMessageRate extends MessageRate,
  TRedisKeys extends Record<string, string>,
> extends Base<TMessageRate> {
  protected readonly queue: TQueueParams;
  protected redisKeys: TRedisKeys | null = null;
  protected heartbeat: Heartbeat | null = null;

  constructor(queue: string | TQueueParams, config: IConfig = {}) {
    super(config);
    this.queue = QueueManager.getQueueParams(queue);
  }

  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    this.logger.debug(`Set up consumer heartbeat...`);
    RedisClient.getNewInstance(this.config, (err, redisClient) => {
      if (err) cb(err);
      else if (!redisClient) cb(new EmptyCallbackReplyError());
      else {
        this.initHeartbeatInstance(redisClient);
        cb();
      }
    });
  };

  protected tearDownHeartbeat = (cb: ICallback<void>): void => {
    this.logger.debug(`Tear down consumer heartbeat...`);
    if (this.heartbeat) {
      this.heartbeat.quit(() => {
        this.logger.debug(`Consumer heartbeat has been torn down.`);
        this.heartbeat = null;
        cb();
      });
    } else {
      this.logger.warn(
        `This is not normal. [this.heartbeat] has not been set up. Ignoring...`,
      );
      cb();
    }
  };

  protected setUpMessageQueue = (cb: ICallback<void>): void => {
    this.logger.debug(
      `Set up message queue (${this.queue}, ${this.queue.ns})...`,
    );
    if (!this.broker) cb(new PanicError(`Expected an instance of Broker`));
    else this.broker.setUpMessageQueue(this.queue, cb);
  };

  protected goingUp(): TFunction[] {
    return super
      .goingUp()
      .concat([this.setUpMessageQueue, this.setUpHeartbeat]);
  }

  protected up(cb?: ICallback<void>): void {
    this.heartbeat?.once(events.HEARTBEAT_TICK, () => {
      super.up(cb);
    });
  }

  protected goingDown(): TFunction[] {
    return [this.tearDownHeartbeat].concat(super.goingDown());
  }

  getQueue(): TQueueParams {
    return this.queue;
  }

  abstract getRedisKeys(): TRedisKeys;

  abstract initHeartbeatInstance(redisClient: RedisClient): void;
}
