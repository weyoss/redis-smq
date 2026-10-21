/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import { selectMessageBrowser } from '../../queue-messages/message-browser.js';
import type { StartPurgeControllerRequestPathDTO } from './StartPurgeControllerRequestPathDTO.js';
import type { StartPurgeControllerResponseDTO } from './StartPurgeControllerResponseDTO.js';

/**
 * Enqueues a purge job for the named message category.
 *
 * Returns `202 Accepted` with the job ID. The purge itself runs
 * asynchronously on a background worker — the 202 means the job was
 * scheduled, not that the messages are gone.
 */
export const startPurge: Controller<
  PathInput<StartPurgeControllerRequestPathDTO>,
  StartPurgeControllerResponseDTO
> = async (deps, input) => {
  const { ns, name, messageStatus } = input.path;

  const browser = selectMessageBrowser(deps, messageStatus);
  const jobId = await browser.purge({ ns, name });

  deps.logger.debug('Purge job queued', {
    queue: { ns, name },
    messageStatus,
    jobId,
  });

  return [202, { jobId }];
};
