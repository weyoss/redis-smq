/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IRedisSMQErrorProperties {
  code: string;
  defaultMessage: string;
}

// Base properties for error options
type TBaseErrorOptions = {
  message?: string;
};

// Conditionally define the options type.
// If M is 'never', metadata is optional and can be undefined.
// If M is a specific type, metadata is required.
export type IRedisSMQErrorOptions<M> = TBaseErrorOptions &
  ([M] extends [never] ? { metadata?: never } : { metadata: M });
