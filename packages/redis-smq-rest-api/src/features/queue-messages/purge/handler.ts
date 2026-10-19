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

/**
 * Enqueues a purge job for the selected message category.
 *
 * Returns `202 Accepted` with the job ID. The purge itself runs
 * asynchronously on a background worker — the 202 means the job was
 * scheduled, not that the messages are gone.
 */
export const purgeQueueMessages: Controller<
  RequestInput<
    PurgeQueueMessagesControllerRequestPathDTO,
    PurgeQueueMessagesControllerRequestQueryDTO,
    unknown
  >,
  PurgeQueueMessagesControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const { status } = input.query;

  const browser = selectMessageBrowser(deps, status);
  const jobId = await browser.purge({ ns, name });

  deps.logger.debug('Purge job queued', { queue: { ns, name }, jobId, status });

  return [202, { jobId }];
};
