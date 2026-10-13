/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IRedisSMQParsedConfig } from 'redis-smq';
import type { Controller, RequestInput } from '../../../http/index.js';

export const getConfiguration: Controller<
  RequestInput,
  IRedisSMQParsedConfig
> = async (deps) => {
  deps.logger.debug('Retrieving library configuration');
  const config = await deps.configManager.getConfig();
  return [200, config];
};
