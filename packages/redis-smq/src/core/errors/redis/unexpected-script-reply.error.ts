/*
 * packages/redis-smq/src/core/errors/redis/unexpected-script-reply.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';

export class UnexpectedScriptReplyError extends RedisSMQError<{
  reply: unknown;
}> {
  static override readonly code = 'RedisSMQ.Redis.UnexpectedScriptReply';
  static override readonly defaultMessage =
    'Redis script returned an unexpected reply type.';
}
