/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventEmitterPubSub } from '../../../common/event-emitter/event-emitter-pub-sub';
import { IQueueParams } from '../../../../types';
import { TEventEmitterEvent } from 'redis-smq-common';

export interface IConsumerGroupEvent extends TEventEmitterEvent {
  consumerGroupCreated: (queue: IQueueParams, groupId: string) => void;
  consumerGroupDeleted: (queue: IQueueParams, groupId: string) => void;
}

export class ConsumerGroupEventEmitter extends EventEmitterPubSub<IConsumerGroupEvent> {}
