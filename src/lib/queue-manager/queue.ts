import {
  EQueueSettingType,
  EQueueType,
  IRequiredConfig,
  TQueueParams,
  TQueueSettings,
} from '../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueExistsError } from './errors/queue-exists.error';
import { QueueNotFoundError } from './errors/queue-not-found.error';
import { initDeleteQueueTransaction } from './delete-queue-transaction';
import { errors, RedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';
import { EmptyCallbackReplyError } from 'redis-smq-common/dist/src/errors/empty-callback-reply.error';

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

  /**
   * When priorityQueuing = false the default queue type is EQueueType.LIFO_QUEUE
   *
   * @deprecated Use save() method instead.
   */
  create(
    queue: string | TQueueParams,
    priorityQueuing: boolean,
    cb: ICallback<{ queue: TQueueParams; settings: TQueueSettings }>,
  ): void {
    const queueType = priorityQueuing
      ? EQueueType.PRIORITY_QUEUE
      : EQueueType.LIFO_QUEUE;
    this.save(queue, queueType, cb);
  }

  save(
    queue: string | TQueueParams,
    queueType: EQueueType,
    cb: ICallback<{ queue: TQueueParams; settings: TQueueSettings }>,
  ): void {
    const queueParams = Queue.getParams(this.config, queue);
    const { keyQueues, keyNsQueues, keyNamespaces, keyQueueSettings } =
      redisKeys.getQueueKeys(queueParams);
    const queueIndex = JSON.stringify(queueParams);
    this.redisClient.runScript(
      ELuaScriptName.CREATE_QUEUE,
      [
        keyNamespaces,
        keyNsQueues,
        keyQueues,
        keyQueueSettings,
        EQueueSettingType.QUEUE_TYPE,
      ],
      [queueParams.ns, queueIndex, queueType],
      (err, reply) => {
        if (err) cb(err);
        else if (!reply) cb(new QueueExistsError());
        else
          this.getSettings(queueParams, (err, settings) => {
            if (err) cb(err);
            else if (!settings) cb(new EmptyCallbackReplyError());
            else cb(null, { queue: queueParams, settings });
          });
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

  static parseSettings(raw: Record<string, string>): TQueueSettings {
    // default settings
    const queueSettings: TQueueSettings = {
      // Keeping compatibility with v7.1 queue settings schema
      // which does not use TQueueSettings.type
      // todo: remove TQueueSettings.priorityQueuing key within next major release
      priorityQueuing: false,
      type: EQueueType.LIFO_QUEUE,
      exchange: null,
      rateLimit: null,
    };
    for (const key in raw) {
      // Keeping compatibility with v7.1 queue settings schema
      // which does not use EQueueSettingType.QUEUE_TYPE
      // todo: remove EQueueSettingType.PRIORITY_QUEUING checking within next major release
      if (key === EQueueSettingType.PRIORITY_QUEUING && JSON.parse(raw[key])) {
        queueSettings.type = EQueueType.PRIORITY_QUEUE;
        queueSettings.priorityQueuing = true;
      }
      if (key === EQueueSettingType.QUEUE_TYPE) {
        queueSettings.type = Number(raw[key]);
        if (queueSettings.type === EQueueType.PRIORITY_QUEUE) {
          queueSettings.priorityQueuing = true;
        }
      }
      if (key === EQueueSettingType.RATE_LIMIT) {
        queueSettings.rateLimit = JSON.parse(raw[key]);
      }
      if (key === EQueueSettingType.EXCHANGE) {
        queueSettings.exchange = raw[key];
      }
    }
    return queueSettings;
  }

  static getSettings(
    config: IRequiredConfig,
    redisClient: RedisClient,
    queue: string | TQueueParams,
    cb: ICallback<TQueueSettings>,
  ): void {
    const queueParams = Queue.getParams(config, queue);
    const { keyQueueSettings } = redisKeys.getQueueKeys(queueParams);
    redisClient.hgetall(keyQueueSettings, (err, reply) => {
      if (err) cb(err);
      else if (!reply || !Object.keys(reply).length)
        cb(new QueueNotFoundError());
      else {
        const queueSettings = Queue.parseSettings(reply);
        cb(null, queueSettings);
      }
    });
  }

  static list(redisClient: RedisClient, cb: ICallback<TQueueParams[]>): void {
    const { keyQueues } = redisKeys.getMainKeys();
    redisClient.sscanFallback(keyQueues, (err, reply) => {
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
