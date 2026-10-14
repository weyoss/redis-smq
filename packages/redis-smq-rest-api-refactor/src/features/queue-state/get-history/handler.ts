/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetQueueStateHistoryControllerRequestPathDTO } from './GetQueueStateHistoryControllerRequestPathDTO.js';
import type { GetQueueStateHistoryControllerResponseDTO } from './GetQueueStateHistoryControllerResponseDTO.js';

export const getQueueStateHistory: Controller<
  PathInput<GetQueueStateHistoryControllerRequestPathDTO>,
  GetQueueStateHistoryControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const history = await deps.queueState.getStateHistory({ ns, name });
  return [200, history];
};
