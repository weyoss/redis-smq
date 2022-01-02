import { IConfig, ICallback, TFunction, TQueueParams } from '../../types';
import { MessageRate } from './message-rate';
import { redisKeys } from './common/redis-keys/redis-keys';
import { QueueManager } from './queue-manager/queue-manager';
import { PanicError } from './common/errors/panic.error';
import { Base } from './base';

export abstract class ExtendedBase<
  TMessageRate extends MessageRate,
  TRedisKeys extends Record<string, string>,
> extends Base<TMessageRate> {
  protected readonly queue: TQueueParams;
  protected redisKeys: TRedisKeys | null = null;

  constructor(queueName: string, config: IConfig = {}) {
    super(config);
    this.queue = {
      name: redisKeys.validateRedisKey(queueName),
      ns: redisKeys.getNamespace(),
    };
  }

  protected setUpMessageQueue = (cb: ICallback<void>): void => {
    this.logger.debug(
      `Set up message queue (${this.queue}, ${this.queue.ns})...`,
    );
    if (!this.sharedRedisClient)
      cb(new PanicError(`Expected an instance of RedisClient`));
    else QueueManager.setUpMessageQueue(this.queue, this.sharedRedisClient, cb);
  };

  protected goingUp(): TFunction[] {
    return super.goingUp().concat([this.setUpMessageQueue]);
  }

  getQueue(): TQueueParams {
    return this.queue;
  }

  abstract getRedisKeys(): TRedisKeys;
}
