/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { CancelPurgeControllerRequestPathDTO } from './CancelPurgeControllerRequestPathDTO.js';
import type { CancelPurgeControllerRequestQueryDTO } from './CancelPurgeControllerRequestQueryDTO.js';
import type { CancelPurgeControllerResponseDTO } from './CancelPurgeControllerResponseDTO.js';
import { withBrowserForJob } from '../with-browser-for-job.js';

export const cancelPurge: Controller<
  RequestInput<
    CancelPurgeControllerRequestPathDTO,
    CancelPurgeControllerRequestQueryDTO,
    never
  >,
  CancelPurgeControllerResponseDTO
> = async (deps, input) => {
  const { ns, name, jobId } = input.path;
  const { status } = input.query;

  await withBrowserForJob(deps, jobId, status, (browser) =>
    browser.cancelPurge({ ns, name }, jobId),
  );

  return [204, null];
};
