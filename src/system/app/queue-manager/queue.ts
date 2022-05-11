import {
  ICallback,
  ICompatibleLogger,
  TQueueParams,
  TQueueSettings,
} from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { QueueExistsError } from './errors/queue-exists.error';
import { QueueNotFoundError } from './errors/queue-not-found.error';
import { getNamespacedLogger } from '../../common/logger';
import { initDeleteQueueTransaction } from './delete-queue-transaction';

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

  getQueueSettings(
    queue: string | TQueueParams,
    cb: ICallback<TQueueSettings>,
  ): void {
    Queue.getQueueSettings(this.redisClient, queue, cb);
  }

  queueExists(queue: string | TQueueParams, cb: ICallback<boolean>): void {
    Queue.queueExists(this.redisClient, queue, cb);
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

  static getQueueParams(queue: string | TQueueParams): TQueueParams {
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

  static getQueueSettings(
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<TQueueSettings>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const {
      keyQueueSettings,
      keyQueueSettingsPriorityQueuing,
      keyQueueSettingsRateLimit,
    } = redisKeys.getQueueKeys(queueParams);
    redisClient.hgetall(keyQueueSettings, (err, reply) => {
      if (err) cb(err);
      else if (!reply || !Object.keys(reply).length)
        cb(new QueueNotFoundError());
      else {
        // default settings
        const queueSettings: TQueueSettings = { priorityQueuing: false };
        for (const key in reply) {
          if (key === keyQueueSettingsPriorityQueuing) {
            queueSettings.priorityQueuing = JSON.parse(reply[key]);
          }
          if (key === keyQueueSettingsRateLimit) {
            queueSettings.rateLimit = JSON.parse(reply[key]);
          }
        }
        cb(null, queueSettings);
      }
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

  static queueExists(
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = Queue.getQueueParams(queue);
    const { keyQueues } = redisKeys.getMainKeys();
    redisClient.sismember(
      keyQueues,
      JSON.stringify(queueParams),
      (err, reply) => {
        if (err) cb(err);
        else cb(null, !!reply);
      },
    );
  }
}
