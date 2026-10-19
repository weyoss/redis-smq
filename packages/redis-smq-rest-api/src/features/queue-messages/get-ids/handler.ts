/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IBrowserPage } from 'redis-smq';
import type { Controller, RequestInput } from '../../../http/index.js';
import type { GetMessageIdsControllerRequestPathDTO } from './GetMessageIdsControllerRequestPathDTO.js';
import type { GetMessageIdsControllerRequestQueryDTO } from './GetMessageIdsControllerRequestQueryDTO.js';
import type { GetMessageIdsControllerResponseDTO } from './GetMessageIdsControllerResponseDTO.js';
import { selectMessageBrowser } from '../message-browser.js';

export const getMessageIds: Controller<
  RequestInput<
    GetMessageIdsControllerRequestPathDTO,
    GetMessageIdsControllerRequestQueryDTO,
    never
  >,
  GetMessageIdsControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const { page, pageSize, status } = input.query;

  const browser = selectMessageBrowser(deps, status);
  const result: IBrowserPage<string> = await browser.getMessageIds(
    { ns, name },
    page,
    pageSize,
  );

  return [200, result];
};
