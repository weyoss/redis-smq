/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TEventEmitterEvent } from '../../event/index.js';
import { ILoggerConfig } from '../../logger/index.js';
import { IRedisConfig } from '../../redis-client/index.js';

export type TEventBusEvent = TEventEmitterEvent & {
  error: (err: Error) => void;
};

export interface IEventBusConfig {
  logger?: ILoggerConfig;
}

export interface IEventBusRedisConfig extends IEventBusConfig {
  redis: IRedisConfig;
}
