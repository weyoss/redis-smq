/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export type RouteName =
  | 'home'
  | 'namespaces'
  | 'queues'
  | 'exchanges'
  | 'queue'
  | 'messages'
  | 'notFound';

export interface RouteParams {
  queue: { ns: string; queue: string };
  messages: { ns: string; queue: string };
}
