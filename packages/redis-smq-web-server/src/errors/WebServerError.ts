/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

/**
 * Base class for every error this package raises on its own behalf.
 */
export abstract class WebServerError<
  Metadata extends Record<string, unknown> = never,
> extends RedisSMQError<Metadata> {}
