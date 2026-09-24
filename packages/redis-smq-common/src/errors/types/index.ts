/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IBaseErrorOptions {
  message?: string;
  cause?: unknown;
}

/**
 * Options accepted by every RedisSMQError.
 *
 * - When `Metadata` is `never` (default), `metadata` is disallowed.
 * - When `Metadata` is any other type, `metadata` is required.
 */
export type IRedisSMQErrorOptions<Metadata = never> = IBaseErrorOptions &
  ([Metadata] extends [never] ? { metadata?: never } : { metadata: Metadata });
