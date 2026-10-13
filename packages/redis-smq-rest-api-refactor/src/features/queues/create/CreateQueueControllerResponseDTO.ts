/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IQueueParams, IQueueProperties } from 'redis-smq';
import type { TErrors } from '../../../errors/index.js';

/**
 * Response shape of `POST /api/queues`.
 *
 * Success returns the newly-created queue's identity and its full
 * property set — the same shape `GET /api/namespaces/:ns/queues/:name`
 * will return. A client that creates a queue can read its properties
 * from the create response without a follow-up GET.
 *
 * Three error branches, all pulled from `TErrors`:
 *
 *   - `InvalidQueueParametersError` (400) — the namespace, name, or
 *     parameter combination fails redis-smq's validation.
 *   - `QueueAlreadyExistsError` (409) — a queue with the same
 *     `{ ns, name }` is already registered.
 *   - `UnexpectedScriptReplyError` (500) — an internal invariant of
 *     the Lua script that persists the queue was violated.
 *
 * A fourth error class the handler can technically raise —
 * `InvalidQueueTypeError` — is not declared here because
 * `queueManager.save()` validates it before any write, and the
 * generated schema already rejects an unrecognized enum value at the
 * HTTP boundary. If a future change makes that error reachable from
 * `save()`, add it as a branch.
 */
export type CreateQueueControllerResponseDTO =
  | readonly [201, { queue: IQueueParams; properties: IQueueProperties }]
  | TErrors['InvalidQueueParametersError']
  | TErrors['QueueAlreadyExistsError']
  | TErrors['UnexpectedScriptReplyError'];
