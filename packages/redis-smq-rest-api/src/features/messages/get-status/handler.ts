/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetMessageStatusControllerRequestPathDTO } from './GetMessageStatusControllerRequestPathDTO.js';
import { GetMessageStatusControllerResponseDTO } from './GetMessageStatusControllerResponseDTO.js';

export const getMessageStatus: Controller<
  PathInput<GetMessageStatusControllerRequestPathDTO>,
  GetMessageStatusControllerResponseDTO
> = async (deps, input) => {
  const status = await deps.messageManager.getMessageStatus(input.path.id);
  return [200, status];
};
