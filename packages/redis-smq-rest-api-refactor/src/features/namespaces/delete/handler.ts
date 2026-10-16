/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { DeleteNamespaceControllerRequestPathDTO } from './DeleteNamespaceControllerRequestPathDTO.js';
import type { DeleteNamespaceControllerResponseDTO } from './DeleteNamespaceControllerResponseDTO.js';

export const deleteNamespace: Controller<
  PathInput<DeleteNamespaceControllerRequestPathDTO>,
  DeleteNamespaceControllerResponseDTO
> = async (deps, input) => {
  await deps.namespaceManager.delete(input.path.ns);
  return [204, null];
};
