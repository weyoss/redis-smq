/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../common/index.js';
import { IEventEmitter, TEventEmitterEvent } from '../../event/index.js';

export type TEventBusEvent = TEventEmitterEvent & {
  error: (err: Error) => void;
};

export interface IEventBus<Events extends TEventBusEvent>
  extends IEventEmitter<Events> {
  shutdown(cb: ICallback<void>): void;
}
