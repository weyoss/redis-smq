/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { GetNamespacesControllerResponseDTO } from './GetNamespacesControllerResponseDTO.js';

export const getNamespaces: Controller<
  RequestInput,
  GetNamespacesControllerResponseDTO
> = async (deps) => {
  const namespaces = await deps.namespaceManager.getNamespaces();
  return [200, namespaces];
};
