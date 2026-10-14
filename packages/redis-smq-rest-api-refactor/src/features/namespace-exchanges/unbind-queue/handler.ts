/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EExchangeType } from 'redis-smq';
import type { Controller, RequestInput } from '../../../http/index.js';
import type { UnbindQueueControllerRequestPathDTO } from './UnbindQueueControllerRequestPathDTO.js';
import type { UnbindQueueControllerRequestQueryDTO } from './UnbindQueueControllerRequestQueryDTO.js';
import type { UnbindQueueControllerResponseDTO } from './UnbindQueueControllerResponseDTO.js';
import { findExchangeOrThrow } from '../exchange-lookup.js';

/**
 * Unbinds a queue from an exchange.
 *
 * Dispatch is by the exchange's type — not by query shape, unlike
 * `bind-queue`. The original package's `ExchangesService.unbindQueue`
 * performed the lookup and dispatched on the type, so this preserves
 * that behavior. The asymmetry with `bind-queue` is intentional: it
 * matches the original.
 */
export const unbindQueue: Controller<
  RequestInput<
    UnbindQueueControllerRequestPathDTO,
    UnbindQueueControllerRequestQueryDTO,
    unknown
  >,
  UnbindQueueControllerResponseDTO
> = async (deps, input) => {
  const queueParams = { ns: input.path.ns, name: input.path.queue };
  const exchangeParams = { ns: input.path.ns, name: input.path.exchange };
  const { routingKey, routingPattern } = input.query;

  const exchange = await findExchangeOrThrow(
    deps,
    exchangeParams.ns,
    exchangeParams.name,
  );

  if (exchange.type === EExchangeType.DIRECT) {
    await deps.exchangeDirect.unbindQueue(
      queueParams,
      exchangeParams,
      routingKey ?? '',
    );
  } else if (exchange.type === EExchangeType.TOPIC) {
    await deps.exchangeTopic.unbindQueue(
      queueParams,
      exchangeParams,
      routingPattern ?? '',
    );
  } else {
    await deps.exchangeFanout.unbindQueue(queueParams, exchangeParams);
  }

  return [204, null];
};
