/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IBackoffConfig {
  baseDelay?: number;
  maxDelay?: number;
  maxAttempts?: number;
  jitter?: boolean; // Add randomness (default: true)
}

export type IBackoffParsedConfig = Required<IBackoffConfig>;
