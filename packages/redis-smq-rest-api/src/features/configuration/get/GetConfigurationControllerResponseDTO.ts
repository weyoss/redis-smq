/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IRedisSMQParsedConfig } from 'redis-smq';
import { TErrors } from '../../../errors/index.js';

/**
 * Response shape of `GET /api/config`.
 *
 * A union of status-tagged tuples. The success branch carries the
 * fully-resolved config; the error branch declares the one runtime
 * failure `configManager.getConfig()` can raise. In practice the
 * config is written during server bootstrap, so a request against a
 * running server will almost never see the error branch — but
 * declaring it keeps the OpenAPI document honest about what the
 * endpoint can return.
 *
 * The status and name are inlined as literals. `ts-json-schema-
 * generator` reads `readonly [400, 'ConfigurationNotFoundError']` and
 * emits `{ "const": 400 }` / `{ "const": "ConfigurationNotFoundError" }`,
 * which is what `getResponseSchemas` splits on and what generated
 * clients use to discriminate branches.
 */
export type GetConfigurationControllerResponseDTO =
  readonly [200, IRedisSMQParsedConfig] | TErrors['ConfigurationNotFoundError'];
