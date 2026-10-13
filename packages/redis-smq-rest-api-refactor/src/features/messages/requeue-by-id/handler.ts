/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { RequeueMessageByIdControllerRequestPathDTO } from './RequeueMessageByIdControllerRequestPathDTO.js';

export const requeueMessageById: Controller<
  PathInput<RequeueMessageByIdControllerRequestPathDTO>,
  null
> = async (deps, input) => {
  await deps.messageManager.requeueMessageById(input.path.id);
  return [204, null];
};
