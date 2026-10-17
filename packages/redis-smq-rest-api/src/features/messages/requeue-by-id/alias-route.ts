/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../../../http/index.js';
import { getSchema } from '../../../http/index.js';
import { requeueMessageById } from './handler.js';

/**
 * Second registration of the same handler at
 * `POST /api/messages/:id/requeue`.
 *
 * The original package registered the requeue operation under both
 * paths — `/api/messages/:id` and `/api/messages/:id/requeue` — and
 * the refactor preserves that for wire compatibility. A client that
 * posts to either URL gets the same behavior.
 *
 * The distinct `operationId` is required: OpenAPI mandates unique
 * operation IDs, and `buildDocument` enforces it at build time. The
 * `-Alias` suffix keeps the two entries distinguishable in the
 * generated spec without changing either endpoint's semantics.
 */
export const requeueMessageByIdAliasRoute: RouteDefinition = {
  method: 'post',
  path: '/api/messages/:id/requeue',
  tags: ['Messages'],
  operationId: 'requeueMessageByIdAlias',
  request: {
    path: getSchema('RequeueMessageByIdControllerRequestPathDTO'),
  },
  response: { 204: { type: 'null' } },
  handler: requeueMessageById,
};
