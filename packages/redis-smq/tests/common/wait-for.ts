/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Poll until predicate() returns true, or throw after timeoutMs.
 * The shutdownRequested -> shutdownMessageHandler sequence crosses two async
 * hops (Redis script round-trip + handler.shutdown's goingDown hooks), so we
 * cannot assert synchronously.
 */
export async function waitFor(
  predicate: (() => boolean) | (() => Promise<boolean>),
  timeoutMs = 2000,
  intervalMs = 20,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  if (!(await predicate())) {
    throw new Error(
      `waitFor: predicate did not become true within ${timeoutMs}ms`,
    );
  }
}
