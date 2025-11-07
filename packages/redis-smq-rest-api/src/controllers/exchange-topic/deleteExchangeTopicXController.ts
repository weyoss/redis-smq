/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { DeleteExchangeTopicXControllerRequestPathDTO } from '../../dto/controllers/exchange-topic/DeleteExchangeTopicXControllerRequestPathDTO.js';
import { DeleteExchangeTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/DeleteExchangeTopicXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const deleteExchangeTopicXController: TControllerRequestHandler<
  DeleteExchangeTopicXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteExchangeTopicXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeTopicService');
  const { ns, topic: name } = ctx.scope.resolve('requestPathDTO');
  await service.deleteExchange({ ns, name });
  return [204, null];
};
