/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  type AppRouteRecord,
  type BreadcrumbMeta,
  routes,
} from '@/router/routes.ts';

// Helper to extract params from a route path
const extractParamsFromPath = (path: string): string[] => {
  const matches = path.match(/:([a-zA-Z]+)/g);
  if (!matches) return [];
  return matches.map((match) => match.substring(1));
};

// Helper to resolve a label with parameters
const resolveLabel = (
  label: string,
  paramNames: string[],
  params: Record<string, string>,
): string => {
  let resolved = label;
  paramNames.forEach((paramName) => {
    const value = params[paramName] || paramName;
    resolved = resolved.replace(`:${paramName}`, value);
  });
  return resolved;
};

// Helper to build actual path from route path and params
const buildPath = (
  routePath: string,
  params: Record<string, string>,
): string => {
  let path = routePath;
  const paramNames = extractParamsFromPath(routePath);

  paramNames.forEach((paramName) => {
    const value = params[paramName];
    if (value) {
      path = path.replace(`:${paramName}`, value);
    }
  });

  return path;
};

export const getBreadcrumbTrail = (
  route: AppRouteRecord,
  params: Record<string, string>,
): { label: string; path: string }[] => {
  const trail: { label: string; path: string }[] = [];
  let current: AppRouteRecord | undefined = route;

  while (current?.meta?.breadcrumb) {
    const breadcrumb: BreadcrumbMeta = current?.meta?.breadcrumb;
    const { label, path: breadcrumbPath, parent } = breadcrumb;

    // Extract parameter names from the current route path
    const paramNames = extractParamsFromPath(current.path);

    // Resolve the label with actual parameter values
    let resolvedLabel = label;
    if (paramNames.length > 0) {
      resolvedLabel = resolveLabel(label, paramNames, params);
    }

    // Build the actual path for this breadcrumb
    let resolvedPath = breadcrumbPath || '';
    if (!resolvedPath) {
      // If no custom path, build from the route path
      resolvedPath = buildPath(current.path, params);
    } else if (paramNames.length > 0) {
      resolvedPath = resolveLabel(resolvedPath, paramNames, params);
    }

    trail.unshift({ label: resolvedLabel, path: resolvedPath });
    current = parent ? routes.find((r) => r.name === parent) : undefined;
  }

  return trail;
};
