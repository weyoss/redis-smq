/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisServerUnsupportedPlatformError } from './errors/index.js';

export type TRedisServerPlatform = Extract<NodeJS.Platform, 'linux' | 'darwin'>;

export const REDIS_SERVER_PLATFORM_LIST: TRedisServerPlatform[] = [
  'darwin',
  'linux',
];

function isSupportedPlatform(
  platform: NodeJS.Platform,
): platform is TRedisServerPlatform {
  // type-coverage:ignore-next-line
  return REDIS_SERVER_PLATFORM_LIST.includes(<TRedisServerPlatform>platform);
}

export const getSupportedPlatform = (): TRedisServerPlatform => {
  const platform = process.platform;
  if (isSupportedPlatform(platform)) {
    return platform;
  }
  throw new RedisServerUnsupportedPlatformError();
};
