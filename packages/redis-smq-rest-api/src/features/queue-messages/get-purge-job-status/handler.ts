/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { GetPurgeJobStatusControllerRequestPathDTO } from './GetPurgeJobStatusControllerRequestPathDTO.js';
import type { GetPurgeJobStatusControllerRequestQueryDTO } from './GetPurgeJobStatusControllerRequestQueryDTO.js';
import type { GetPurgeJobStatusControllerResponseDTO } from './GetPurgeJobStatusControllerResponseDTO.js';
import { withBrowserForJob } from '../with-browser-for-job.js';

/**
 * Returns just the status enum for a purge job.
 *
 * A convenience over `GET …/messages/purge/:jobId` for clients that
 * poll frequently — the status response is a single integer, versus
 * the full job record (status + timestamps + `meta.purged`).
 */
export const getPurgeJobStatus: Controller<
  RequestInput<
    GetPurgeJobStatusControllerRequestPathDTO,
    GetPurgeJobStatusControllerRequestQueryDTO,
    never
  >,
  GetPurgeJobStatusControllerResponseDTO
> = async (deps, input) => {
  const { ns, name, jobId } = input.path;
  const { status } = input.query;

  const jobStatus = await withBrowserForJob(deps, jobId, status, (browser) =>
    browser.getPurgeJobStatus({ ns, name }, jobId),
  );

  return [200, jobStatus];
};
