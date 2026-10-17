/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { SetQueueRateLimitControllerRequestPathDTO } from './SetQueueRateLimitControllerRequestPathDTO.js';
import type { SetQueueRateLimitControllerRequestBodyDTO } from './SetQueueRateLimitControllerRequestBodyDTO.js';
import type { SetQueueRateLimitControllerResponseDTO } from './SetQueueRateLimitControllerResponseDTO.js';

/**
 * Sets the queue's rate limit and returns the persisted value.
 *
 * The original `QueueRateLimitService.setRateLimit` wrote via `set()`
 * and then read back via `get()`, throwing if the read returned
 * nothing. The throw was `CallbackEmptyReplyError` — a
 * `redis-smq-common` error not present in the status map, so it
 * surfaces as a 500. That's the same outcome a plain `Error` produces
 * here, but the message is clearer in logs.
 *
 * The double call is preserved because the manager's `set()` returns
 * `void` on the version this package targets — it does not resolve to
 * the new rate limit. Reading back is the only way to return the
 * persisted shape.
 */
export const setQueueRateLimit: Controller<
  RequestInput<
    SetQueueRateLimitControllerRequestPathDTO,
    Record<string, unknown>,
    SetQueueRateLimitControllerRequestBodyDTO
  >,
  SetQueueRateLimitControllerResponseDTO
> = async (deps, input) => {
  const queue = { ns: input.path.ns, name: input.path.name };

  await deps.queueRateLimit.set(queue, input.body);

  const persisted = await deps.queueRateLimit.get(queue);
  if (!persisted) {
    throw new Error(
      `Rate limit for queue ${queue.ns}/${queue.name} was not persisted`,
    );
  }

  return [200, persisted];
};
