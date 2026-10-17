/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IRedisSMQConfig } from 'redis-smq';

/**
 * Request body of `PATCH /api/config`.
 *
 * Every field of `IRedisSMQConfig` is optional; `updateConfig` merges
 * the partial over the existing config. The DTO is an alias rather
 * than an interface because it adds nothing to the underlying type —
 * the alias exists so `ts-json-schema-generator` emits a definition
 * under a stable name that `route.ts` can reference.
 */
export type UpdateConfigurationControllerRequestBodyDTO = IRedisSMQConfig;
