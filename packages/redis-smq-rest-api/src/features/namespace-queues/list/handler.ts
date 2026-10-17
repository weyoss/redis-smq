/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetNamespaceQueuesControllerRequestPathDTO } from './GetNamespaceQueuesControllerRequestPathDTO.js';
import type { GetNamespaceQueuesControllerResponseDTO } from './GetNamespaceQueuesControllerResponseDTO.js';

export const getNamespaceQueues: Controller<
  PathInput<GetNamespaceQueuesControllerRequestPathDTO>,
  GetNamespaceQueuesControllerResponseDTO
> = async (deps, input) => {
  const queues = await deps.namespaceManager.getNamespaceQueues(input.path.ns);
  return [200, queues];
};
