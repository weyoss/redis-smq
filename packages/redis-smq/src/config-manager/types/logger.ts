/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IConsoleLoggerOptions } from 'redis-smq-common';

/**
 * Parsed and normalized configuration interface.
 *
 * This interface represents the final configuration after processing and
 * merging defaults.
 *
 * @internal
 */
export interface ILoggerParsedConfig {
  enabled: boolean;
  options: Required<IConsoleLoggerOptions>;
}
