/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IMessageTransferable } from 'redis-smq';
import type { Controller, QueryInput } from '../../../http/index.js';
import type { GetMessagesByIdsControllerRequestQueryDTO } from './GetMessagesByIdsControllerRequestQueryDTO.js';

export const getMessagesByIds: Controller<
  QueryInput<GetMessagesByIdsControllerRequestQueryDTO>,
  IMessageTransferable[]
> = async (deps, input) => {
  const messages = await deps.messageManager.getMessagesByIds(input.query.ids);
  return [200, messages];
};
