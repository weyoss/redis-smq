/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IMessageParams, IQueueParams, ITopicParams } from 'redis-smq';

export interface PublishMessageControllerRequestBodyDTO {
  message: Partial<
    Omit<
      IMessageParams,
      'id' | 'createdAt' | 'exchange' | 'consumerGroupId' | 'destinationQueue'
    >
  >;
  exchange:
    | { queue: string | IQueueParams; topic?: never; fanOut?: never }
    | { queue?: never; topic: string | ITopicParams; fanOut?: never }
    | { queue?: never; topic?: never; fanOut: string };
}
