/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../http/index.js';
import { pingRoute } from './ping/route.js';
import { getConfigurationRoute } from './configuration/get/route.js';
import { updateConfigurationRoute } from './configuration/update/route.js';

/**
 * The complete HTTP surface of the package.
 *
 * Every route in this array is served by the Koa router **and**
 * described in the generated OpenAPI document. Both consumers read
 * from this array — there is no second source of truth. A route that
 * isn't listed here isn't served; a route that is listed here can't
 * be missing from the spec.
 *
 * ## Adding a route
 *
 * 1. Create `src/features/<name>/<operation>/` with:
 *      - `handler.ts`   — exports a `Controller<In, Out>`
 *      - `route.ts`     — exports a `RouteDefinition`
 *      - `*DTO.ts`      — request/response shapes (optional per route)
 *      - `handler.test.ts`
 * 2. Import the route here and append it to the array.
 *
 * Nothing else changes: the router registers it at boot, the OpenAPI
 * generator picks it up on the next build, Swagger UI reflects it
 * without any config.
 *
 * ## Ordering
 *
 * The array order is the registration order with Koa. It matters only
 * when two routes share a path prefix and one uses a wildcard (`*`)
 * or a catch-all — the first matching route wins. For concrete paths
 * (the normal case), order is irrelevant. List new routes
 * alphabetically by path segment when possible; it makes the array
 * readable and diffs stable.
 */
export const routes: RouteDefinition[] = [
  pingRoute,
  getConfigurationRoute,
  updateConfigurationRoute,
];
