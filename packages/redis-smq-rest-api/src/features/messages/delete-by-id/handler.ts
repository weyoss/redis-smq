/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { DeleteMessageByIdControllerRequestPathDTO } from './DeleteMessageByIdControllerRequestPathDTO.js';
import { DeleteMessageByIdControllerResponseDTO } from './DeleteMessageByIdControllerResponseDTO.js';

export const deleteMessageById: Controller<
  PathInput<DeleteMessageByIdControllerRequestPathDTO>,
  DeleteMessageByIdControllerResponseDTO
> = async (deps, input) => {
  await deps.messageManager.deleteMessageById(input.path.id);
  return [204, null];
};
