/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as path from 'path/posix';
import {
  EControllerRequestMethod,
  EControllerRequestPayload,
  TControllerRequestHandlerGeneric,
} from '../controller/types/index.js';
import {
  IRouterResourceDescription,
  TRouterResource,
  TRouterResourceMap,
} from './types/index.js';

const resourcePath: string[] = [];
const resourceTags: string[][] = [];

function isResourceDescription(c: unknown): c is IRouterResourceDescription {
  return !!c && typeof c === 'object' && Object.keys(c).includes('handler');
}

function getResourceControllerParams(
  controller: TControllerRequestHandlerGeneric,
) {
  const controllerName = controller.name;
  const controllerRoutePath = path.resolve(...resourcePath);
  return {
    controllerRoutePath,
    controllerName,
    controller,
  };
}

function getResourceTags() {
  return resourceTags.filter((i) => i.length).at(-1);
}

export async function parseRoutingMap(
  routingMap: TRouterResourceMap | TRouterResource,
  fn: (
    c: TControllerRequestHandlerGeneric,
    n: string,
    method: EControllerRequestMethod,
    payload: EControllerRequestPayload[],
    path: string,
    description?: string,
    tags?: string[],
  ) => Promise<void>,
) {
  if (routingMap instanceof Array) {
    for (const item of routingMap) {
      await parseRoutingMap(item, fn);
    }
  } else {
    if (isResourceDescription(routingMap)) {
      const { handler, description, method, payload } = routingMap;
      const { controller, controllerName, controllerRoutePath } =
        getResourceControllerParams(handler);
      const tags = getResourceTags();
      await fn(
        controller,
        controllerName,
        method,
        payload,
        controllerRoutePath,
        description,
        tags,
      );
    } else {
      const { path, tags = [], resource } = routingMap;
      resourcePath.push(path);
      resourceTags.push(tags);
      await parseRoutingMap(resource, fn);
      resourcePath.pop();
      resourceTags.pop();
    }
  }
}
