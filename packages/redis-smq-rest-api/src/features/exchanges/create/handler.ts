/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { BodyInput, Controller } from '../../../http/index.js';
import type { CreateExchangeControllerRequestBodyDTO } from './CreateExchangeControllerRequestBodyDTO.js';
import { CreateExchangeControllerResponseDTO } from './CreateExchangeControllerResponseDTO.js';

/**
 * Creates an exchange and returns its identity plus full properties.
 */
export const createExchange: Controller<
  BodyInput<CreateExchangeControllerRequestBodyDTO>,
  CreateExchangeControllerResponseDTO
> = async (deps, input) => {
  const { exchange, type, queuePolicy } = input.body;

  deps.logger.debug('Creating exchange', { exchange, type, queuePolicy });

  await deps.exchangeManager.create(exchange, type, queuePolicy);
  const properties = await deps.exchangeManager.getProperties(exchange);

  return [201, { exchange, properties }];
};
