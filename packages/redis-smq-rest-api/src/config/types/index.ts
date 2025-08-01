/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig } from 'redis-smq';

export type TRestApiConfig = {
  port?: number;
  basePath?: string;
};

export interface IRedisSMQRestApiConfig extends IRedisSMQConfig {
  apiServer?: TRestApiConfig;
}

export interface IRedisSMQRestApiParsedConfig extends IRedisSMQConfig {
  apiServer: Required<TRestApiConfig>;
}
