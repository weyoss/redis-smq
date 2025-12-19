/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { GetBindingPatternsTopicXControllerRequestPathDTO } from '../../dto/controllers/exchange-topic/GetBindingPatternsTopicXControllerRequestPathDTO.js';
import { GetBindingPatternsTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/GetBindingPatternsTopicXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const getBindingPatternsTopicXController: TControllerRequestHandler<
  GetBindingPatternsTopicXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetBindingPatternsTopicXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeTopicService');
  const { ns, topic } = ctx.scope.resolve('requestPathDTO');
  const r = await service.getBindingPatterns({ ns, name: topic });
  return [200, r];
};
