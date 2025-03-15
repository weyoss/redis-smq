/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { GetNamespacesControllerResponseDTO } from '../../dto/controllers/namespaces/GetNamespacesControllerResponseDTO.js';

export const getNamespacesController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetNamespacesControllerResponseDTO
> = async () => {
  const namespacesService =
    Container.getInstance().resolve('namespacesService');
  const r = await namespacesService.getNamespaces();
  return [200, r];
};
