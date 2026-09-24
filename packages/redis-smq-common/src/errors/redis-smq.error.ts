/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorOptions } from './types/index.js';

export abstract class RedisSMQError<Metadata = never> extends Error {
  /** Stable machine-readable code. Must be overridden. */
  static readonly code: string = 'RedisSMQ.Unknown';

  /** Human-readable fallback used when the caller does not pass a message. */
  static readonly defaultMessage: string = 'Unknown error.';

  public readonly metadata: Metadata | null;

  constructor(
    ...args: [Metadata] extends [never]
      ? [options?: IRedisSMQErrorOptions<Metadata>]
      : [options: IRedisSMQErrorOptions<Metadata>]
  ) {
    const ctor = new.target;
    const options = (args[0] ?? {}) as IRedisSMQErrorOptions<Metadata>;

    super(options.message ?? ctor.defaultMessage);

    this.metadata = (options.metadata as Metadata | undefined) ?? null;

    if ('cause' in options && options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }

    // Match Error's name semantics: own, non-enumerable, writable.
    Object.defineProperty(this, 'name', {
      value: ctor.name,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    // Trim internal frames from the stack when running on V8.
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ctor);
    }
  }

  /** Stable code, derived from the class. */
  get code(): string {
    return (this.constructor as typeof RedisSMQError).code;
  }

  get [Symbol.toStringTag](): string {
    return this.name;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      cause: this.cause,
    };
  }

  static isRedisSMQError(value: unknown): value is RedisSMQError {
    return value instanceof RedisSMQError;
  }
}
