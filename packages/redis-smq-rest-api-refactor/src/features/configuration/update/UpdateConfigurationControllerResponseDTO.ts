/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IRedisSMQParsedConfig } from 'redis-smq';
import type { TErrors } from '../../../errors/index.js';

/**
 * Response shape of `PATCH /api/config`.
 *
 * Two error branches, both pulled from `TErrors`:
 *
 *   - `InvalidConfigurationError` (400) — the patch fails type or
 *     range validation. redis-smq raises this before writing.
 *   - `ConfigurationUpdateError` (422) — the patch is well-formed but
 *     semantically rejected.
 *
 * If either error's status changes in `errorStatus.ts`, this DTO and
 * the OpenAPI document update together — the DTO doesn't hold a
 * second copy of the number.
 */
export type UpdateConfigurationControllerResponseDTO =
  | readonly [200, IRedisSMQParsedConfig]
  | TErrors['InvalidConfigurationError']
  | TErrors['ConfigurationUpdateError'];
