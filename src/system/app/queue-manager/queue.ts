import { ICallback, TQueueParams, TRedisClientMulti } from '../../../../types';
import { RedisClient } from '../../common/redis-client/redis-client';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { waterfall } from '../../lib/async';
import { validateMessageQueueDeletion } from './common';
import { EmptyCallbackReplyError } from '../../common/errors/empty-callback-reply.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';
import { QueueExistsError } from './errors/queue-exists.error';
import { QueueNotFoundError } from './errors/queue-not-found.error';
import { processingQueue } from '../consumer/consumer-message-handler/processing-queue';

export interface IQueueInfo {
  priorityQueuing: boolean;
}

export function getQueueParams(
  queue: string | Partial<TQueueParams>,
): TQueueParams {
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

export function createQueue(
  redisClient: RedisClient,
  queue: TQueueParams,
  priorityQueuing: boolean,
  cb: ICallback<void>,
): void {
  const queueParams = getQueueParams(queue);
  const {
    keyQueues,
    keyNsQueues,
    keyNamespaces,
    keyQueueSettings,
    keyQueueSettingsPriorityQueuing,
  } = redisKeys.getQueueKeys(queueParams);
  const queueIndex = JSON.stringify(queueParams);
  redisClient.runScript(
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

export function getQueue(
  redisClient: RedisClient,
  queue: string | Partial<TQueueParams>,
  cb: ICallback<IQueueInfo>,
): void {
  const queueParams = getQueueParams(queue);
  const { keyQueues } = redisKeys.getMainKeys();
  const queueIndex = JSON.stringify(queueParams);
  redisClient.hget(keyQueues, queueIndex, (err, reply) => {
    if (err) cb(err);
    else if (!reply) cb(new QueueNotFoundError());
    else cb(null, JSON.parse(reply));
  });
}

export function queueExists(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<boolean>,
): void {
  const queueParams = getQueueParams(queue);
  const { keyQueues } = redisKeys.getMainKeys();
  const queueIndex = JSON.stringify(queueParams);
  redisClient.hexists(keyQueues, queueIndex, (err, reply) => {
    if (err) cb(err);
    else cb(null, !!reply);
  });
}

export function listQueues(
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

export function deleteQueueTransaction(
  redisClient: RedisClient,
  queue: TQueueParams,
  multi: TRedisClientMulti | undefined,
  cb: ICallback<TRedisClientMulti>,
): void {
  const {
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueuePendingPriorityMessageIds,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
    keyRateQueueDeadLettered,
    keyRateQueueAcknowledged,
    keyRateQueuePublished,
    keyRateQueueDeadLetteredIndex,
    keyRateQueueAcknowledgedIndex,
    keyRateQueuePublishedIndex,
    keyLockRateQueuePublished,
    keyLockRateQueueAcknowledged,
    keyLockRateQueueDeadLettered,
    keyQueueConsumers,
    keyProcessingQueues,
    keyQueues,
    keyNsQueues,
    keyQueueRateLimitCounter,
    keyQueueSettings,
  } = redisKeys.getQueueKeys(queue);
  const keys: string[] = [
    keyQueuePending,
    keyQueueDL,
    keyQueueProcessingQueues,
    keyQueuePendingPriorityMessageIds,
    keyQueueAcknowledged,
    keyQueuePendingPriorityMessages,
    keyRateQueueDeadLettered,
    keyRateQueueAcknowledged,
    keyRateQueuePublished,
    keyRateQueueDeadLetteredIndex,
    keyRateQueueAcknowledgedIndex,
    keyRateQueuePublishedIndex,
    keyLockRateQueuePublished,
    keyLockRateQueueAcknowledged,
    keyLockRateQueueDeadLettered,
    keyQueueConsumers,
    keyQueueRateLimitCounter,
    keyQueueSettings,
  ];
  redisClient.watch(
    [keyQueueConsumers, keyQueueProcessingQueues, keyQueueSettings],
    (err) => {
      if (err) cb(err);
      else {
        waterfall(
          [
            (cb: ICallback<void>): void =>
              getQueue(redisClient, queue, (err) => cb(err)),
            (cb: ICallback<void>): void =>
              validateMessageQueueDeletion(redisClient, queue, cb),
            (cb: ICallback<string[]>) => {
              processingQueue.getQueueProcessingQueues(
                redisClient,
                queue,
                (err, reply) => {
                  if (err) cb(err);
                  else {
                    const pQueues = Object.keys(reply ?? {});
                    cb(null, pQueues);
                  }
                },
              );
            },
          ],
          (err?: Error | null, processingQueues?: string[] | null) => {
            if (err) redisClient.unwatch(() => cb(err));
            else {
              const tx = multi || redisClient.multi();
              const str = JSON.stringify(queue);
              tx.srem(keyQueues, str);
              tx.srem(keyNsQueues, str);
              const pQueues = processingQueues ?? [];
              if (pQueues.length) {
                keys.push(...pQueues);
                tx.srem(keyProcessingQueues, ...pQueues);
              }
              tx.del(...keys);
              cb(null, tx);
            }
          },
        );
      }
    },
  );
}

export function deleteQueue(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<void>,
): void {
  deleteQueueTransaction(redisClient, queue, undefined, (err, multi) => {
    if (err) cb(err);
    else if (!multi) cb(new EmptyCallbackReplyError());
    else redisClient.execMulti(multi, (err) => cb(err));
  });
}
