/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class BackgroundJobTargetLockedError extends RedisSMQError<{
  target: unknown;
}> {
  static override readonly code = 'RedisSMQ.BackgroundJobs.JobLocked';
  static override readonly defaultMessage =
    'Background job target is already being processed.';
}
