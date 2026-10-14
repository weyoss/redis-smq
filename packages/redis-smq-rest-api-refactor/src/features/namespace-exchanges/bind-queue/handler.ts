/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../../http/index.js';
import type { BindQueueControllerRequestPathDTO } from './BindQueueControllerRequestPathDTO.js';
import type { BindQueueControllerRequestQueryDTO } from './BindQueueControllerRequestQueryDTO.js';
import type { BindQueueControllerResponseDTO } from './BindQueueControllerResponseDTO.js';

/**
 * Binds a queue to an exchange.
 *
 * Dispatch is by query shape, not by exchange type — matching the
 * original `ExchangesService.bindQueue`. A `routingKey` selects the
 * DIRECT manager, a `routingPattern` selects TOPIC, and neither
 * selects FANOUT. The library rejects a mismatched binding with
 * `ExchangeTypeMismatchError`.
 */
export const bindQueue: Controller<
  RequestInput<
    BindQueueControllerRequestPathDTO,
    BindQueueControllerRequestQueryDTO,
    unknown
  >,
  BindQueueControllerResponseDTO
> = async (deps, input) => {
  const queueParams = { ns: input.path.ns, name: input.path.queue };
  const exchangeParams = { ns: input.path.ns, name: input.path.exchange };
  const { routingKey, routingPattern } = input.query;

  if (routingKey) {
    await deps.exchangeDirect.bindQueue(
      queueParams,
      exchangeParams,
      routingKey,
    );
  } else if (routingPattern) {
    await deps.exchangeTopic.bindQueue(
      queueParams,
      exchangeParams,
      routingPattern,
    );
  } else {
    await deps.exchangeFanout.bindQueue(queueParams, exchangeParams);
  }

  return [204, null];
};
