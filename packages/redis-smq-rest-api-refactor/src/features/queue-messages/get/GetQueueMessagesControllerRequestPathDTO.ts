/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Path parameters of `GET …/messages`.
 *
 * Declared as a `type` with explicit fields rather than
 * `interface … extends IQueueParams`. `IQueueParams` is an interface
 * in redis-smq, and an interface is not assignable to the
 * `Record<string, string>` default of `RequestInput`'s `PathDTO`
 * slot. A closed object type is.
 */
export type GetQueueMessagesControllerRequestPathDTO = {
  ns: string;
  name: string;
};
