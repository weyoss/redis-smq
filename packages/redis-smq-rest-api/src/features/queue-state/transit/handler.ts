/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { TransitQueueStateControllerRequestPathDTO } from './TransitQueueStateControllerRequestPathDTO.js';
import type { TransitQueueStateControllerRequestBodyDTO } from './TransitQueueStateControllerRequestBodyDTO.js';
import type { TransitQueueStateControllerResponseDTO } from './TransitQueueStateControllerResponseDTO.js';

/**
 * Transitions a queue's operational state.
 *
 * Dispatches on the `state` field of the request body:
 *
 *   - `pause`  → `queueState.pause(queue, options)`
 *   - `resume` → `queueState.resume(queue, options)`
 *   - `stop`   → `queueState.stop(queue, options)`
 *
 * The dispatch order in the original package's
 * `QueueOperationalStateService.transitQueueState` was `resume`,
 * `stop`, then `pause` as the fallback. This handler inverts the
 * check to `pause`/`resume` explicit and `stop` as the fallback —
 * same behavior, clearer reading. Both orderings cover the same
 * three cases because `state` is validated to one of exactly three
 * values by the schema.
 *
 * The library rejects invalid transitions (e.g. `pause` on an
 * already-paused queue) with `QueueStateTransitionError` (422). The
 * handler doesn't pre-check; it lets the library be the authority on
 * what transitions are legal.
 */
export const transitQueueState: Controller<
  RequestInput<
    TransitQueueStateControllerRequestPathDTO,
    Record<string, unknown>,
    TransitQueueStateControllerRequestBodyDTO
  >,
  TransitQueueStateControllerResponseDTO
> = async (deps, input) => {
  const queue = { ns: input.path.ns, name: input.path.name };
  const { state, options } = input.body;

  if (state === 'pause') {
    const transition = await deps.queueState.pause(queue, options);
    return [200, transition];
  }
  if (state === 'resume') {
    const transition = await deps.queueState.resume(queue, options);
    return [200, transition];
  }
  const transition = await deps.queueState.stop(queue, options);
  return [200, transition];
};
