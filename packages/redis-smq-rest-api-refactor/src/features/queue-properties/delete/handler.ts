/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { DeleteQueueControllerRequestPathDTO } from './DeleteQueueControllerRequestPathDTO.js';
import type { DeleteQueueControllerResponseDTO } from './DeleteQueueControllerResponseDTO.js';

export const deleteQueue: Controller<
  PathInput<DeleteQueueControllerRequestPathDTO>,
  DeleteQueueControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  await deps.queueManager.delete({ ns, name });
  return [204, null];
};
