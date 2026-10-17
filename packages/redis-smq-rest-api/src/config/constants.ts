/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { join, resolve } from 'path';
import { env } from 'redis-smq-common';

/** Default TCP port when `apiServer.port` is not provided. */
export const DEFAULT_PORT = 7210;

/**
 * Default base path when `apiServer.basePath` is not provided.
 * Normalized by `parseConfig` — this is the raw fallback only.
 */
export const DEFAULT_BASE_PATH = '/';

/**
 * Filename of the generated JSON Schema (from `*DTO.ts` files).
 * Written to `dist/assets/schema.json` by `scripts/gen-json-schema.ts`.
 * Read at runtime by `src/http/schema.ts`.
 */
export const JSON_SCHEMA_FILENAME = 'schema.json';

/**
 * Filename of the generated OpenAPI document.
 * Written to `dist/assets/openapi-specs.json` by `scripts/gen-openapi.ts`.
 * Served as a static file by `src/openapi/serve.ts`.
 */
export const OPENAPI_SCHEMA_FILENAME = 'openapi-specs.json';

/**
 * Absolute path to the `dist/assets/` directory.
 *
 * Resolved relative to this file's location:
 *   - production (compiled): `dist/config/constants.js` → `dist/assets/`
 *   - development (tsx):     `src/config/constants.ts`  → `src/assets/` (empty)
 *
 * During development, run the build once so `dist/assets/` exists,
 * or set `REDIS_SMQ_REST_API_ASSETS` to point elsewhere.
 */
const here = env.getCurrentDir();
const assetsDir =
  process.env.REDIS_SMQ_REST_API_ASSETS ??
  resolve(here, '../../../../dist/assets');

export const constants = {
  assetsDir,
  jsonSchemaPath: join(assetsDir, JSON_SCHEMA_FILENAME),
  openapiSchemaPath: join(assetsDir, OPENAPI_SCHEMA_FILENAME),
} as const;
