/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IExchangeParams, IMessageParams, IQueueParams } from 'redis-smq';

/**
 * Request body of `POST /api/messages`.
 *
 * The `exchange` field is a discriminated union: exactly one of
 * `queue`, `topic`, `fanOut`, or `direct` must be present. The
 * `?: never` markers on the *other* three fields enforce mutual
 * exclusion at the type level and — because
 * `ts-json-schema-generator` translates `never` to a `false`-like
 * schema — at the wire level too.
 */
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
        topic?: never;
        fanOut?: never;
        direct?: never;
      }
    | {
        queue?: never;
        topic: string | IExchangeParams;
        fanOut?: never;
        direct?: never;
      }
    | {
        queue?: never;
        topic?: never;
        fanOut: string | IExchangeParams;
        direct?: never;
      }
    | {
        queue?: never;
        topic?: never;
        fanOut?: never;
        direct: string | IExchangeParams;
      };
}
