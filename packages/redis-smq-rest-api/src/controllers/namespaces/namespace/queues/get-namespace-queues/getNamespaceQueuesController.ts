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
} from '../../../../../lib/types/controller.js';
import { Container } from '../../../../../container/Container.js';
import { GetNamespaceQueuesControllerRequestPathDTO } from './GetNamespaceQueuesControllerRequestPathDTO.js';
import { GetNamespaceQueuesControllerResponseDTO } from './GetNamespaceQueuesControllerResponseDTO.js';

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
