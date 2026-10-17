/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetMessageUnacknowledgementHistoryControllerRequestPathDTO } from './GetMessageUnacknowledgementHistoryControllerRequestPathDTO.js';
import { GetMessageUnacknowledgementHistoryControllerResponseDTO } from './GetMessageUnacknowledgementHistoryControllerResponseDTO.js';

export const getMessageUnacknowledgementHistory: Controller<
  PathInput<GetMessageUnacknowledgementHistoryControllerRequestPathDTO>,
  GetMessageUnacknowledgementHistoryControllerResponseDTO
> = async (deps, input) => {
  const history = await deps.messageManager.getMessageUnacknowledgementHistory(
    input.path.id,
  );
  return [200, history];
};
