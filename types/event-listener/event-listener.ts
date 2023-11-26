/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, EventEmitter } from 'redis-smq-common';
import { TRedisSMQEvent } from '../event';

export type TEventListenerInitArgs = {
  eventProvider: EventEmitter<TRedisSMQEvent>;
  instanceId: string;
};

export interface IEventListener {
  init(args: TEventListenerInitArgs, cb: ICallback<void>): void;
  quit(cb: ICallback<void>): void;
}
