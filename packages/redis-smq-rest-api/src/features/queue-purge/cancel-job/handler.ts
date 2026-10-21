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
import type { CancelPurgeJobControllerRequestPathDTO } from './CancelPurgeJobControllerRequestPathDTO.js';
import type { CancelPurgeJobControllerResponseDTO } from './CancelPurgeJobControllerResponseDTO.js';

export const cancelPurgeJob: Controller<
  PathInput<CancelPurgeJobControllerRequestPathDTO>,
  CancelPurgeJobControllerResponseDTO
> = async (deps, input) => {
  const { ns, name, messageStatus, jobId } = input.path;

  const browser = selectMessageBrowser(deps, messageStatus);
  await browser.cancelPurge({ ns, name }, jobId);

  return [204, null];
};
