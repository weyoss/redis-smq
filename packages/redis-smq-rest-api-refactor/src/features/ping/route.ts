/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../../http/index.js';
import { ping } from './handler.js';

/**
 * Route definition for `GET /api/ping`.
 *
 * Unlike the routes that will follow, this one declares its response
 * schema inline rather than deriving it from a `*ResponseDTO.ts` file
 * via `getResponseSchemas`. Two reasons:
 *
 * 1. **It's the proof endpoint.** The refactor's schema pipeline
 *    (`ts-json-schema-generator` → `schema.json` → `getResponseSchemas`)
 *    isn't wired for this route yet, because there are no DTO files
 *    under `src/features/` until the configuration slice lands. Adding
 *    a one-off DTO for ping would prove the wrong thing.
 *
 * 2. **The response schema is trivial.** Three lines of JSON Schema,
 *    hand-written. Adding a DTO file, running codegen, and reading the
 *    result through `getResponseSchemas` would be more moving parts
 *    for the same bytes.
 *
 * When the configuration slice arrives and the schema pipeline is
 * active, ping is the easiest candidate to migrate: replace the inline
 * `response` object with `getResponseSchemas('PingControllerResponseDTO')`,
 * add a `PingControllerResponseDTO.ts` next to the handler, and delete
 * the inline block. Three-line change.
 *
 * The schema reflects the **envelope-applied** body — `{ data: ... }`,
 * not the raw handler return. The router wraps; the schema describes
 * what the router sends. Keeping them in sync is the one invariant
 * `buildDocument` relies on.
 */
export const pingRoute: RouteDefinition = {
  method: 'get',
  path: '/api/ping',
  tags: ['Diagnostics'],
  operationId: 'ping',
  request: {},
  response: {
    200: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            ok: { const: true },
            uptime: { type: 'number' },
          },
          required: ['ok', 'uptime'],
          additionalProperties: false,
        },
      },
      required: ['data'],
      additionalProperties: false,
    },
  },
  handler: ping,
};
