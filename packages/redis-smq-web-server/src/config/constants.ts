/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Default TCP port when `webServer.port` is not provided.
 *
 * 8080 is the conventional "alternative HTTP" port and the value the
 * original package used. It sits next to `redis-smq-rest-api`'s default
 * of 7210 so that both can run on the same host without colliding —
 * `rest-api` on 7210, `web-server` (which embeds or proxies it) on 8080.
 */
export const DEFAULT_PORT = 8080;

/**
 * Default base path when `webServer.basePath` is not provided.
 * Normalized by `parseConfig` — this is the raw fallback only.
 */
export const DEFAULT_BASE_PATH = '/';
