/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../../../lib/types/controller.js';
import { Container } from '../../../../container/Container.js';
import { DeleteNamespaceControllerRequestPathDTO } from './DeleteNamespaceControllerRequestPathDTO.js';
import { DeleteNamespaceControllerResponseDTO } from './DeleteNamespaceControllerResponseDTO.js';

export const deleteNamespaceController: TControllerRequestHandler<
  DeleteNamespaceControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteNamespaceControllerResponseDTO
> = async (ctx) => {
  const namespacesService =
    Container.getInstance().resolve('namespacesService');
  const { ns } = ctx.scope.resolve('requestPathDTO');
  await namespacesService.deleteNamespace(ns);
  return [204, null];
};
