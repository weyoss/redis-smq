/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetQueueStateControllerRequestPathDTO } from './GetQueueStateControllerRequestPathDTO.js';
import type { GetQueueStateControllerResponseDTO } from './GetQueueStateControllerResponseDTO.js';

export const getQueueState: Controller<
  PathInput<GetQueueStateControllerRequestPathDTO>,
  GetQueueStateControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const state = await deps.queueState.getState({ ns, name });
  return [200, state];
};
