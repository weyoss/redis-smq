/*
 * packages/redis-smq/tests/common/wait-for.ts
 */

/**
 * Poll until predicate() returns true, or throw after timeoutMs.
 * The shutdownRequested -> shutdownMessageHandler sequence crosses two async
 * hops (Redis script round-trip + handler.shutdown's goingDown hooks), so we
 * cannot assert synchronously.
 */
export async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2000,
  intervalMs = 20,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  if (!predicate()) {
    throw new Error(
      `waitFor: predicate did not become true within ${timeoutMs}ms`,
    );
  }
}
