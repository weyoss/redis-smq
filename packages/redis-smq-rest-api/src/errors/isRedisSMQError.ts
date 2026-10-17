/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

/**
 * Type guard for anything that descends from redis-smq-common's
 * `RedisSMQError`.
 *
 * Note that this catches **two** categories:
 *
 *   1. Errors raised by `redis-smq` itself (e.g. `QueueNotFoundError`,
 *      `ExchangeAlreadyExistsError`). These flow out of `deps.*` method
 *      calls inside handlers.
 *
 *   2. Errors raised by this package — every `RedisSMQRestApiError`
 *      subclass extends `RedisSMQError`, so `InvalidApiServerParamsError`,
 *      `RequestValidationError`, etc. all satisfy this guard.
 *
 * Both categories use the same `name`/`code`/`metadata` shape, so the
 * HTTP error handler can process them uniformly: look up the status by
 * `error.name`, then special-case `RequestValidationError` for its
 * structured `errorObjects`.
 *
 * The alternative — a union type guard like
 * `isRedisSMQError(e) || isRestApiError(e)` — would force every call
 * site to know about both hierarchies. One guard, one branch.
 */
export function isRedisSMQError(error: unknown): error is RedisSMQError {
  return error instanceof RedisSMQError;
}
