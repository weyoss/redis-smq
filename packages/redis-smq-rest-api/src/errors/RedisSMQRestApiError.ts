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
 *
 * Extends redis-smq-common's `RedisSMQError` so that:
 *   - `isRedisSMQError()` recognizes these errors at the HTTP boundary;
 *   - metadata is carried in a standardized shape;
 *   - `name` is set automatically by the Error constructor.
 *
 * Concrete subclasses declare two static fields:
 *   - `code`           — stable identifier (e.g. 'RedisSMQRestApi.Configuration.InvalidApiServerParams')
 *   - `defaultMessage` — human-readable fallback message
 *
 * Both are read by redis-smq-common's `RedisSMQError` to populate the
 * `name`, `code`, and `message` fields on instances. Subclasses should
 * not override the constructor.
 *
 * @typeParam Metadata — shape of the `metadata` payload carried by instances.
 *                       Use `never` when an error has no metadata.
 */
export abstract class RedisSMQRestApiError<
  Metadata extends Record<string, unknown> = never,
> extends RedisSMQError<Metadata> {}
