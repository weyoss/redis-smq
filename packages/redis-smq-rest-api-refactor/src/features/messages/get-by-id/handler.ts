/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetMessageByIdControllerRequestPathDTO } from './GetMessageByIdControllerRequestPathDTO.js';
import { GetMessageByIdControllerResponseDTO } from './GetMessageByIdControllerResponseDTO.js';

export const getMessageById: Controller<
  PathInput<GetMessageByIdControllerRequestPathDTO>,
  GetMessageByIdControllerResponseDTO
> = async (deps, input) => {
  const message = await deps.messageManager.getMessageById(input.path.id);
  return [200, message];
};
