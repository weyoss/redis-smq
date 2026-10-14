/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { GetQueueMessagesControllerRequestPathDTO } from './GetQueueMessagesControllerRequestPathDTO.js';
import type { GetQueueMessagesControllerRequestQueryDTO } from './GetQueueMessagesControllerRequestQueryDTO.js';
import type { GetQueueMessagesControllerResponseDTO } from './GetQueueMessagesControllerResponseDTO.js';
import { selectMessageBrowser } from '../message-browser.js';

export const getQueueMessages: Controller<
  RequestInput<
    GetQueueMessagesControllerRequestPathDTO,
    GetQueueMessagesControllerRequestQueryDTO,
    never
  >,
  GetQueueMessagesControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const { page, pageSize, status } = input.query;

  const browser = selectMessageBrowser(deps, status);
  const result = await browser.getMessages({ ns, name }, page, pageSize);

  return [200, result];
};
