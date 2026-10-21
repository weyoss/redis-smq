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
import type { GetPurgeJobControllerRequestPathDTO } from './GetPurgeJobControllerRequestPathDTO.js';
import type { GetPurgeJobControllerResponseDTO } from './GetPurgeJobControllerResponseDTO.js';

export const getPurgeJob: Controller<
  PathInput<GetPurgeJobControllerRequestPathDTO>,
  GetPurgeJobControllerResponseDTO
> = async (deps, input) => {
  const { ns, name, messageStatus, jobId } = input.path;

  const browser = selectMessageBrowser(deps, messageStatus);
  const job = await browser.getPurgeJob({ ns, name }, jobId);

  return [200, job];
};
