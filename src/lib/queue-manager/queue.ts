import {
  ICallback,
  ICompatibleLogger,
  TQueueParams,
  TQueueSettings,
} from '../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { QueueExistsError } from './errors/queue-exists.error';
import { QueueNotFoundError } from './errors/queue-not-found.error';
import { getNamespacedLogger } from '../../common/logger/logger';
import { initDeleteQueueTransaction } from './delete-queue-transaction';

export class Queue {
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = getNamespacedLogger(this.constructor.name);
  }

  create(
    queue: string | TQueueParams,
    priorityQueuing: boolean,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(queue);
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

  getSettings(
    queue: string | TQueueParams,
    cb: ICallback<TQueueSettings>,
  ): void {
    Queue.getSettings(this.redisClient, queue, cb);
  }

  exists(queue: string | TQueueParams, cb: ICallback<boolean>): void {
    Queue.exists(this.redisClient, queue, cb);
  }

  list(cb: ICallback<TQueueParams[]>): void {
    Queue.list(this.redisClient, cb);
  }

  delete(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(queue);
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

  static getParams(queue: string | TQueueParams): TQueueParams {
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

  static getSettings(
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<TQueueSettings>,
  ): void {
    const queueParams = Queue.getParams(queue);
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

  static list(redisClient: RedisClient, cb: ICallback<TQueueParams[]>): void {
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

  static exists(
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = Queue.getParams(queue);
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
