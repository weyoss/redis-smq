/*
 * packages/redis-smq/src/core/errors/redis/script-result-mismatch.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';

export class ScriptResultMismatchError extends RedisSMQError<{
  expected: number;
  actual: number;
}> {
  static override readonly code = 'RedisSMQ.Redis.ScriptResultMismatch';
  static override readonly defaultMessage =
    'Redis script reported processing a different number of entries than expected.';
}
