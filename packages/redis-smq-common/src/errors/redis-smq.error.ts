/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IRedisSMQErrorOptions,
  IRedisSMQErrorProperties,
} from './types/index.js';

export abstract class RedisSMQError<
  Metadata extends Record<string, unknown> = never,
> extends Error {
  protected readonly code: string;
  protected readonly metadata: Metadata | null;

  // The constructor uses a conditional type on its arguments.
  // If Metadata is 'never', the 'options' argument is optional.
  // If Metadata is a specific type, the 'options' argument is required.
  constructor(
    ...args: [Metadata] extends [never]
      ? [options?: IRedisSMQErrorOptions<Metadata>]
      : [options: IRedisSMQErrorOptions<Metadata>]
  ) {
    const ctor = new.target;
    const { defaultMessage, code } = ctor.props();

    const options = args[0] ?? {};
    super(options.message ?? defaultMessage);

    this.code = code;
    this.metadata = options.metadata ?? null;
  }

  getMetadata(): Metadata | null {
    return this.metadata;
  }

  override get name(): string {
    return this.constructor.name;
  }

  static get props() {
    // type-coverage:ignore-next-line
    return this.prototype.getProps;
  }

  abstract getProps(): IRedisSMQErrorProperties;

  /**
   * Provides a stable, JSON-friendly representation for logs or network transport.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}
