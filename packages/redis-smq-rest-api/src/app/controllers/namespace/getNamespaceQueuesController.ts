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
import { GetNamespaceQueuesControllerRequestPathDTO } from '../../dto/controllers/namespaces/GetNamespaceQueuesControllerRequestPathDTO.js';
import { GetNamespaceQueuesControllerResponseDTO } from '../../dto/controllers/namespaces/GetNamespaceQueuesControllerResponseDTO.js';

export const getNamespaceQueuesController: TControllerRequestHandler<
  GetNamespaceQueuesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetNamespaceQueuesControllerResponseDTO
> = async (ctx) => {
  const namespacesService =
    Container.getInstance().resolve('namespacesService');
  const { ns } = ctx.scope.resolve('requestPathDTO');
  const r = await namespacesService.getNamespaceQueues(ns);
  return [200, r];
};
