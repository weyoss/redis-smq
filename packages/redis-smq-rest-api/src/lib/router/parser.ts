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

/**
 * Type guard to check if an object is a router resource description
 * @param resource - The resource to check
 * @returns True if the resource is a router resource description
 */
function isRouterResourceDescription(
  resource: unknown,
): resource is IRouterResourceDescription {
  return (
    !!resource &&
    typeof resource === 'object' &&
    'handler' in resource &&
    typeof resource.handler === 'function'
  );
}

/**
 * Extract controller metadata from a handler and path
 * @param handlerFunction - The controller handler function
 * @param pathSegments - The current resource path segments
 * @returns Object containing controller metadata
 */
function extractControllerMetadata(
  handlerFunction: TControllerRequestHandlerGeneric,
  pathSegments: string[],
) {
  const handlerName = handlerFunction.name;
  const fullRoutePath = path.resolve(...pathSegments);
  return {
    controllerRoutePath: fullRoutePath,
    controllerName: handlerName,
    controller: handlerFunction,
  };
}

/**
 * Parse a routing map and execute a callback for each endpoint resource
 * @param routingDefinition - The routing map or resource to parse
 * @param callbackFn - Callback function to execute for each endpoint
 * @param accumulatedPath - Accumulated path segments (for recursion)
 * @param accumulatedTags - Accumulated tags (for recursion)
 */
export async function parseRoutingMap(
  routingDefinition: TRouterResourceMap | TRouterResource,
  callbackFn: (
    controller: TControllerRequestHandlerGeneric,
    controllerName: string,
    method: EControllerRequestMethod,
    payload: EControllerRequestPayload[],
    path: string,
    description?: string,
    tags?: string[],
  ) => Promise<void>,
  accumulatedPath: string[] = [],
  accumulatedTags: string[][] = [],
): Promise<void> {
  try {
    if (Array.isArray(routingDefinition)) {
      for (const routeItem of routingDefinition) {
        await parseRoutingMap(
          routeItem,
          callbackFn,
          accumulatedPath,
          accumulatedTags,
        );
      }
    } else if (isRouterResourceDescription(routingDefinition)) {
      const { handler, description, method, payload } = routingDefinition;
      const { controller, controllerName, controllerRoutePath } =
        extractControllerMetadata(handler, accumulatedPath);

      // Get the most recent non-empty tags array
      const applicableTags = accumulatedTags
        .filter((tagSet) => tagSet.length)
        .at(-1);

      await callbackFn(
        controller,
        controllerName,
        method,
        payload,
        controllerRoutePath,
        description,
        applicableTags,
      );
    } else {
      const { path: routePathSegment, tags = [], resource } = routingDefinition;

      // Create new arrays to avoid mutating the original ones
      const updatedPath = [...accumulatedPath, routePathSegment];
      const updatedTags = [...accumulatedTags, tags];

      await parseRoutingMap(resource, callbackFn, updatedPath, updatedTags);
    }
  } catch (error) {
    // Rethrow with more context
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error parsing routing map: ${errorMessage}`);
  }
}
