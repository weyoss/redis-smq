/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from 'redis-smq';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { GetAllExchangesControllerRequestQueryDTO } from '../../dto/controllers/exchange-fan-out/GetAllExchangesControllerRequestQueryDTO.js';
import { GetAllExchangesControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/GetAllExchangesControllerResponseDTO.js';

export const getAllExchangesController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  GetAllExchangesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetAllExchangesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanOutService');
  const queueParams = ctx.scope.resolve('requestQueryDTO');
  const isQueueParams = (
    queueParams: GetAllExchangesControllerRequestQueryDTO,
  ): queueParams is IQueueParams => {
    return !!(queueParams.ns && queueParams.name);
  };
  const fanOutExchanges = await service.getAllExchanges(
    isQueueParams(queueParams) ? queueParams : undefined,
  );
  return [200, fanOutExchanges];
};
