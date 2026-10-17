/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { PurgeQueueMessagesControllerRequestPathDTO } from './PurgeQueueMessagesControllerRequestPathDTO.js';
import type { PurgeQueueMessagesControllerRequestQueryDTO } from './PurgeQueueMessagesControllerRequestQueryDTO.js';
import type { PurgeQueueMessagesControllerResponseDTO } from './PurgeQueueMessagesControllerResponseDTO.js';
import { selectMessageBrowser } from '../message-browser.js';

export const purgeQueueMessages: Controller<
  RequestInput<
    PurgeQueueMessagesControllerRequestPathDTO,
    PurgeQueueMessagesControllerRequestQueryDTO,
    never
  >,
  PurgeQueueMessagesControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const { status } = input.query;

  const browser = selectMessageBrowser(deps, status);
  await browser.purge({ ns, name });

  return [204, null];
};
