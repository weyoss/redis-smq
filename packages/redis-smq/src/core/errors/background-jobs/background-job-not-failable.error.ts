/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class BackgroundJobNotFailableError extends RedisSMQError<{
  jobId: string;
  reason: string;
}> {
  static override readonly code = 'RedisSMQ.BackgroundJobs.NotFailable';
  static override readonly defaultMessage = 'Background job not failable.';
}
