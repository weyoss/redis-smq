/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Path parameters of `GET …/consumers`.
 *
 * Declared with explicit fields rather than extending `IQueueParams`
 * for the same reason as other path DTOs in the codebase:
 * `IQueueParams` is an interface, and interfaces aren't assignable to
 * `Record<string, string>` under the bivariant method-parameter check.
 * A closed object type is.
 */
export type GetQueueConsumersControllerRequestPathDTO = {
  ns: string;
  name: string;
};
