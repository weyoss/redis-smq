/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IConsoleLoggerOptions } from '../console-logger/index.js';

export interface ILogger {
  info(message: unknown, ...params: unknown[]): void;

  warn(message: unknown, ...params: unknown[]): void;

  error(message: unknown, ...params: unknown[]): void;

  debug(message: unknown, ...params: unknown[]): void;
}

export interface ILoggerConfig {
  /**
   * This property determines whether the logger is enabled or not.
   * If not set, logging operations will be disabled.
   */
  enabled?: boolean;

  /**
   * Options used to configure the ConsoleLogger when it is used.
   * ConsoleLogger is used by default if no other logger is provided.
   */
  options?: IConsoleLoggerOptions;
}
