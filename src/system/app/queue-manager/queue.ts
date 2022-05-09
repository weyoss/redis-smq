import { ICallback, ICompatibleLogger, TQueueParams } from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { QueueExistsError } from './errors/queue-exists.error';
import { QueueNotFoundError } from './errors/queue-not-found.error';
import { getNamespacedLogger } from '../../common/logger';
import { initDeleteQueueTransaction } from './delete-queue-transaction';

export interface IQueueInfo {
  priorityQueuing: boolean;
}

export class Queue {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger(this.constructor.name);
  }

  createQueue(
    queue: string | TQueueParams,
    priorityQueuing: boolean,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const {
      keyQueues,
      keyNsQueues,
      keyNamespaces,
      keyQueueSettings,
      keyQueueSettingsPriorityQueuing,
    } = redisKeys.getQueueKeys(queueParams);
    const queueIndex = JSON.stringify(queueParams);
    this.redisClient.runScript(
      ELuaScriptName.CREATE_QUEUE,
      [
        keyNamespaces,
        keyNsQueues,
        keyQueues,
        keyQueueSettings,
        keyQueueSettingsPriorityQueuing,
      ],
      [queueParams.ns, queueIndex, JSON.stringify(priorityQueuing)],
      (err, reply) => {
        if (err) cb(err);
        else if (!reply) cb(new QueueExistsError());
        else cb();
      },
    );
  }

  getQueue(
    queue: string | Partial<TQueueParams>,
    cb: ICallback<IQueueInfo>,
  ): void {
    Queue.getQueue(this.redisClient, queue, cb);
  }

  queueExists(queue: TQueueParams, cb: ICallback<boolean>): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueues } = redisKeys.getMainKeys();
    const queueIndex = JSON.stringify(queueParams);
    this.redisClient.hexists(keyQueues, queueIndex, (err, reply) => {
      if (err) cb(err);
      else cb(null, !!reply);
    });
  }

  listQueues(cb: ICallback<TQueueParams[]>): void {
    Queue.listQueues(this.redisClient, cb);
  }

  deleteQueue(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getQueueParams(queue);
    initDeleteQueueTransaction(
      this.redisClient,
      queueParams,
      undefined,
      (err, multi) => {
        if (err) cb(err);
        else if (!multi) cb(new EmptyCallbackReplyError());
        else this.redisClient.execMulti(multi, (err) => cb(err));
      },
    );
  }

  static getQueueParams(queue: string | Partial<TQueueParams>): TQueueParams {
    const queueParams =
      typeof queue === 'string'
        ? {
            name: queue,
            ns: redisKeys.getNamespace(),
          }
        : queue;
    const name = redisKeys.validateRedisKey(queueParams.name);
    const ns = queueParams.ns
      ? redisKeys.validateRedisKey(queueParams.ns)
      : redisKeys.getNamespace();
    return {
      name,
      ns,
    };
  }

  static getQueue(
    redisClient: RedisClient,
    queue: string | Partial<TQueueParams>,
    cb: ICallback<IQueueInfo>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueues } = redisKeys.getMainKeys();
    const queueIndex = JSON.stringify(queueParams);
    redisClient.hget(keyQueues, queueIndex, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new QueueNotFoundError());
      else cb(null, JSON.parse(reply));
    });
  }

  static listQueues(
    redisClient: RedisClient,
    cb: ICallback<TQueueParams[]>,
  ): void {
    const { keyQueues } = redisKeys.getMainKeys();
    redisClient.smembers(keyQueues, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new EmptyCallbackReplyError());
      else {
        const messageQueues: TQueueParams[] = reply.map((i) => JSON.parse(i));
        cb(null, messageQueues);
      }
    });
  }
}
