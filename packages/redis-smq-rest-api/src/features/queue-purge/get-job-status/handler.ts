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
import type { GetPurgeJobStatusControllerRequestPathDTO } from './GetPurgeJobStatusControllerRequestPathDTO.js';
import type { GetPurgeJobStatusControllerResponseDTO } from './GetPurgeJobStatusControllerResponseDTO.js';

/**
 * Returns just the status enum for a purge job.
 *
 * A convenience over `GET …/purge/:messageStatus/:jobId` for clients
 * that poll frequently — the status response is a single integer,
 * versus the full job record (status + timestamps + `meta.purged`).
 */
export const getPurgeJobStatus: Controller<
  PathInput<GetPurgeJobStatusControllerRequestPathDTO>,
  GetPurgeJobStatusControllerResponseDTO
> = async (deps, input) => {
  const { ns, name, messageStatus, jobId } = input.path;

  const browser = selectMessageBrowser(deps, messageStatus);
  const jobStatus = await browser.getPurgeJobStatus({ ns, name }, jobId);

  return [200, jobStatus];
};
