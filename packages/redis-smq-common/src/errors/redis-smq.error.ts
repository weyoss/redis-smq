/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export abstract class RedisSMQError extends Error {
  constructor(message?: string) {
    super(message);
  }

  override get name(): string {
    return this.constructor.name;
  }
}
