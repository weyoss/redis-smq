/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export * from './config.js';

export interface ILogger {
  info(message: unknown, ...params: unknown[]): void;

  warn(message: unknown, ...params: unknown[]): void;

  error(message: unknown, ...params: unknown[]): void;

  debug(message: unknown, ...params: unknown[]): void;
}
