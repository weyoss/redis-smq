/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, QueryInput } from '../../../http/index.js';
import type { DeleteMessagesByIdsControllerRequestQueryDTO } from './DeleteMessagesByIdsControllerRequestQueryDTO.js';

export const deleteMessagesByIds: Controller<
  QueryInput<DeleteMessagesByIdsControllerRequestQueryDTO>,
  null
> = async (deps, input) => {
  await deps.messageManager.deleteMessagesByIds(input.query.ids);
  return [204, null];
};
