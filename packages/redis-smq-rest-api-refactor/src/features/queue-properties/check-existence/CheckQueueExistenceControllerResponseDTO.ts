/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { TErrors } from '../../../errors/index.js';

/**
 * Response shape of `HEAD /api/namespaces/:ns/queues/:name`.
 *
 * The handler returns `[200, null]` when the queue exists and throws
 * `QueueNotFoundError` otherwise. Node strips the body from HEAD
 * responses on the wire, so the client sees a 200 with no body or a
 * 400 with no body — the status is the entire signal, which is what
 * HEAD is for.
 *
 * The response tuple declares `null` as the payload because that's
 * what the handler returns. The router wraps it as `{ data: null }`
 * for response validation; Node then drops the body when it writes
 * the HEAD response.
 */
export type CheckQueueExistenceControllerResponseDTO =
  | readonly [200, null]
  | TErrors['QueueNotFoundError']
  | TErrors['InvalidQueueParametersError'];
