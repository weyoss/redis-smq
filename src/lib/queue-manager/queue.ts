import { IRequiredConfig, TQueueParams, TQueueSettings } from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueExistsError } from './errors/queue-exists.error';
import { QueueNotFoundError } from './errors/queue-not-found.error';
import { initDeleteQueueTransaction } from './delete-queue-transaction';
import { errors, RedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class Queue {
  protected config: IRequiredConfig;
  protected redisClient: RedisClient;
  protected logger: ICompatibleLogger;

  constructor(
    config: IRequiredConfig,
    redisClient: RedisClient,
    logger: ICompatibleLogger,
  ) {
    this.config = config;
    this.redisClient = redisClient;
    this.logger = logger;
  }

  create(
    queue: string | TQueueParams,
    priorityQueuing: boolean,
    cb: ICallback<void>,
  ): void {
    const queueParams = Queue.getParams(this.config, queue);
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
    Queue.getSettings(this.config, this.redisClient, queue, cb);
  }

  exists(queue: string | TQueueParams, cb: ICallback<boolean>): void {
    Queue.exists(this.config, this.redisClient, queue, cb);
  }

  list(cb: ICallback<TQueueParams[]>): void {
    Queue.list(this.redisClient, cb);
  }

  delete(queue: string | TQueueParams, cb: ICallback<void>): void {
    const queueParams = Queue.getParams(this.config, queue);
    initDeleteQueueTransaction(
      this.config,
      this.redisClient,
      queueParams,
      undefined,
      (err, multi) => {
        if (err) cb(err);
        else if (!multi) cb(new errors.EmptyCallbackReplyError());
        else multi.exec((err) => cb(err));
      },
    );
  }

  static getParams(
    config: IRequiredConfig,
    queue: string | TQueueParams,
  ): TQueueParams {
    const queueParams: { name: string; ns?: string } =
      typeof queue === 'string' ? { name: queue } : queue;
    const name = redisKeys.validateRedisKey(queueParams.name);
    const ns = queueParams.ns
      ? redisKeys.validateNamespace(queueParams.ns)
      : config.namespace;
    return {
      name,
      ns,
    };
  }

  static getSettings(
    config: IRequiredConfig,
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<TQueueSettings>,
  ): void {
    const queueParams = Queue.getParams(config, queue);
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
      else if (!reply) cb(new errors.EmptyCallbackReplyError());
      else {
        const messageQueues: TQueueParams[] = reply.map((i) => JSON.parse(i));
        cb(null, messageQueues);
      }
    });
  }

  static exists(
    config: IRequiredConfig,
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = Queue.getParams(config, queue);
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
