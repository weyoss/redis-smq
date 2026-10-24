/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Page, Request } from '@playwright/test';

export interface ApiCallMatcher {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Substring the URL must contain. Mutually exclusive with `pathRegex`. */
  pathIncludes?: string;
  /** Regex the URL pathname must match. Mutually exclusive with `pathIncludes`. */
  pathRegex?: RegExp;
}

function matches(request: Request, matcher: ApiCallMatcher): boolean {
  if (request.method() !== matcher.method) return false;
  const pathname = new URL(request.url()).pathname;
  if (matcher.pathIncludes !== undefined) {
    return pathname.includes(matcher.pathIncludes);
  }
  if (matcher.pathRegex !== undefined) {
    return matcher.pathRegex.test(pathname);
  }
  return true;
}

/**
 * Returns a promise that resolves when the matching request fires.
 * Use inside `Promise.all` with the triggering action:
 *
 *   const [request] = await Promise.all([
 *     expectRequest(page, { method: 'DELETE', pathIncludes: '/purge/' }),
 *     page.getByRole('button', { name: 'Purge all messages' }).click(),
 *   ]);
 *   expect(new URL(request.url()).pathname).toMatch(/\/purge\/published$/);
 */
export function expectRequest(
  page: Page,
  matcher: ApiCallMatcher,
): Promise<Request> {
  return page.waitForRequest((r) => matches(r, matcher));
}

/**
 * Extract all values for a query parameter, preserving repetition.
 * Playwright's APIRequestContext serializes repeated keys as
 * `?ids=a&ids=b` — the OpenAPI spec's default form for array params.
 * BULK-9 relies on this shape: not `ids[]=a&ids[]=b`.
 */
export function getQueryValues(request: Request, key: string): string[] {
  const url = new URL(request.url());
  return url.searchParams.getAll(key);
}

/**
 * Returns true when the given query key is present at all — useful for
 * asserting "does not appear" (e.g. `ids[]` must not be sent).
 */
export function hasQueryKey(request: Request, key: string): boolean {
  const url = new URL(request.url());
  return url.searchParams.has(key);
}

/**
 * Parse a JSON request body. Returns `undefined` for empty bodies so
 * tests can distinguish "no body" from "malformed body".
 */
export function getJsonBody(request: Request): unknown {
  const raw = request.postData();
  if (raw === null || raw === '') return undefined;
  return request.postDataJSON();
}

/**
 * Convenience for tests that only care that *some* request matching
 * the criteria fired within a timeout, without using the result.
 *
 *   await triggerAndWait(page, {...}, () => button.click());
 */
export async function triggerAndWait(
  page: Page,
  matcher: ApiCallMatcher,
  action: () => Promise<void>,
): Promise<Request> {
  const [request] = await Promise.all([expectRequest(page, matcher), action()]);
  return request;
}
