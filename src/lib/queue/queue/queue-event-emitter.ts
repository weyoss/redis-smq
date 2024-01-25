/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventEmitterPubSub } from '../../../common/event-emitter/event-emitter-pub-sub';
import { IQueueParams, IQueueProperties } from '../../../../types';

export type TQueueEvent = {
  queueCreated: (queue: IQueueParams, properties: IQueueProperties) => void;
  queueDeleted: (queue: IQueueParams) => void;
};

export class QueueEventEmitter extends EventEmitterPubSub<TQueueEvent> {}
