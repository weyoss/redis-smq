import { RedisClient } from '../../common/redis-client/redis-client';
import { ICallback, TQueueParams, TQueueRateLimit } from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { QueueRateLimitError } from './errors/queue-rate-limit.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';

export function clearQueueRateLimit(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<void>,
): void {
  const {
    keyQueueSettings,
    keyQueueSettingsRateLimit,
    keyQueueRateLimitCounter,
  } = redisKeys.getQueueKeys(queue);
  const multi = redisClient.multi();
  multi.hdel(keyQueueSettings, keyQueueSettingsRateLimit);
  multi.del(keyQueueRateLimitCounter);
  redisClient.execMulti(multi, (err) => cb(err));
}

export function setQueueRateLimit(
  redisClient: RedisClient,
  queue: TQueueParams,
  rateLimit: TQueueRateLimit,
  cb: ICallback<void>,
): void {
  // validating rateLimit params from a javascript client
  const limit = Number(rateLimit.limit);
  if (isNaN(limit) || limit <= 0) {
    cb(
      new QueueRateLimitError(
        `Invalid rateLimit.limit. Expected a positive integer > 0`,
      ),
    );
  }
  const interval = Number(rateLimit.interval);
  if (isNaN(interval) || interval < 1000) {
    cb(
      new QueueRateLimitError(
        `Invalid rateLimit.interval. Expected a positive integer >= 1000`,
      ),
    );
  }
  const validatedRateLimit: TQueueRateLimit = { interval, limit };
  const { keyQueueSettings, keyQueueSettingsRateLimit } =
    redisKeys.getQueueKeys(queue);
  redisClient.hset(
    keyQueueSettings,
    keyQueueSettingsRateLimit,
    JSON.stringify(validatedRateLimit),
    (err) => cb(err),
  );
}

export function getQueueRateLimit(
  redisClient: RedisClient,
  queue: TQueueParams,
  cb: ICallback<TQueueRateLimit>,
): void {
  const { keyQueueSettings, keyQueueSettingsRateLimit } =
    redisKeys.getQueueKeys(queue);
  redisClient.hget(
    keyQueueSettings,
    keyQueueSettingsRateLimit,
    (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(null, null);
      else {
        const rateLimit: TQueueRateLimit = JSON.parse(reply);
        cb(null, rateLimit);
      }
    },
  );
}

export function hasQueueRateLimitExceeded(
  redisClient: RedisClient,
  queue: Required<TQueueParams>,
  rateLimit: TQueueRateLimit,
  cb: ICallback<boolean>,
): void {
  const { limit, interval } = rateLimit;
  const { keyQueueRateLimitCounter } = redisKeys.getQueueKeys(queue);
  redisClient.runScript(
    ELuaScriptName.HAS_QUEUE_RATE_EXCEEDED,
    [keyQueueRateLimitCounter],
    [limit, interval],
    (err, reply) => {
      if (err) cb(err);
      else {
        const hasExceeded = Boolean(reply);
        cb(null, hasExceeded);
      }
    },
  );
}
