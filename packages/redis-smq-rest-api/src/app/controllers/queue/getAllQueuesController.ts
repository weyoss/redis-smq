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
import { GetAllQueuesControllerResponseDTO } from '../../dto/controllers/queues/GetAllQueuesControllerResponseDTO.js';

export const getAllQueuesController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetAllQueuesControllerResponseDTO
> = async () => {
  const queueService = Container.getInstance().resolve('queuesService');
  const r = await queueService.getQueues();
  return [200, r];
};
