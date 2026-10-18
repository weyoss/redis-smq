/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IExchangeParams, IMessageParams, IQueueParams } from 'redis-smq';

export interface PublishMessageControllerRequestBodyDTO {
  message: Partial<
    Omit<
      IMessageParams,
      'id' | 'createdAt' | 'exchange' | 'consumerGroupId' | 'destinationQueue'
    >
  >;
  exchange:
    | {
        queue: string | IQueueParams;
        routingKey?: never;
        topic?: never;
        fanOut?: never;
        direct?: never;
      }
    | {
        queue?: never;
        topic: string | IExchangeParams;
        routingKey: string;
        fanOut?: never;
        direct?: never;
      }
    | {
        queue?: never;
        topic?: never;
        fanOut: string | IExchangeParams;
        routingKey?: never;
        direct?: never;
      }
    | {
        queue?: never;
        topic?: never;
        fanOut?: never;
        direct: string | IExchangeParams;
        routingKey: string;
      };
}
