/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { GetPurgeJobControllerRequestPathDTO } from './GetPurgeJobControllerRequestPathDTO.js';
import type { GetPurgeJobControllerRequestQueryDTO } from './GetPurgeJobControllerRequestQueryDTO.js';
import type { GetPurgeJobControllerResponseDTO } from './GetPurgeJobControllerResponseDTO.js';
import { withBrowserForJob } from '../with-browser-for-job.js';

export const getPurgeJob: Controller<
  RequestInput<
    GetPurgeJobControllerRequestPathDTO,
    GetPurgeJobControllerRequestQueryDTO,
    never
  >,
  GetPurgeJobControllerResponseDTO
> = async (deps, input) => {
  const { ns, name, jobId } = input.path;
  const { status } = input.query;

  const job = await withBrowserForJob(deps, jobId, status, (browser) =>
    browser.getPurgeJob({ ns, name }, jobId),
  );

  return [200, job];
};
