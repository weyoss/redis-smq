/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { CountQueueMessagesControllerRequestPathDTO } from './CountQueueMessagesControllerRequestPathDTO.js';
import type { CountQueueMessagesControllerRequestQueryDTO } from './CountQueueMessagesControllerRequestQueryDTO.js';
import type { CountQueueMessagesControllerResponseDTO } from './CountQueueMessagesControllerResponseDTO.js';
import { selectMessageBrowser } from '../message-browser.js';

export const countQueueMessages: Controller<
  RequestInput<
    CountQueueMessagesControllerRequestPathDTO,
    CountQueueMessagesControllerRequestQueryDTO,
    unknown
  >,
  CountQueueMessagesControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const { status, groupBy } = input.query;

  if (groupBy === 'status') {
    const counts = await deps.queuePublishedMessages.countMessagesByStatus({
      ns,
      name,
    });
    return [200, counts];
  }

  const browser = selectMessageBrowser(deps, status);
  const count = await browser.countMessages({ ns, name });
  return [200, count];
};
