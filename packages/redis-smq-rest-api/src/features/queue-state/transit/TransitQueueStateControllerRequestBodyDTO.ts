/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { TQueueStateTransitionUserOptions } from 'redis-smq';

/**
 * Request body of `PATCH /api/namespaces/:ns/queues/:name/state`.
 *
 * `state` selects the action. The three values map to
 * `queueState.pause()`, `queueState.resume()`, and `queueState.stop()`
 * respectively. `options` carries the transition's description and
 * metadata, both of which are recorded in the state history.
 *
 * The schema generator emits `state` as a string enum. An unrecognized
 * value fails AJV validation at the HTTP boundary with
 * `RequestValidationError` before the handler runs.
 */
export interface TransitQueueStateControllerRequestBodyDTO {
  state: 'pause' | 'resume' | 'stop';
  options: TQueueStateTransitionUserOptions;
}
