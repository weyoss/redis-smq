/**
 * Fixture: handler module that terminates the process during evaluation.
 *
 * Loaded by filename (`.js` after build) via `consumer.consume(queue,
 * '/path/to/faulty-exit.js')`. Tests that exercise the file-based handler
 * path reference this file to verify RedisSMQ handles a worker that
 * dies *while loading the handler* — before the handler could ever be
 * invoked, before a callback exists, and before any message can be
 * delivered to it.
 *
 * Behaviour: calls `process.exit(333)` at module top level. The exit code
 * 333 is non-zero and arbitrary; RedisSMQ does not interpret the
 * specific value. What matters is that the process terminates during
 * module evaluation, which the parent observes as a worker that died
 * abnormally (crash, non-zero exit, or unexpected termination — the exact
 * signal depends on how RedisSMQ launches handler workers).
 *
 * WHY A NON-ZERO EXIT CODE AND NOT `process.exit(0)`:
 *   An exit code of 0 is "clean termination". Depending on the worker
 *   launcher, a clean exit during load might be reported as "handler
 *   module finished evaluating and produced no handler", which is what
 *   `faulty.ts` already exercises — a different code path. A non-zero
 *   code forces RedisSMQ down the "worker crashed" branch, which is
 *   the one this fixture exists to test.
 *
 *   The specific value (333) is arbitrary. It is not read by any test and
 *   not compared against anything. It only needs to be non-zero, and 333
 *   is memorable enough that if it ever appears in a log, the source is
 *   immediately obvious.
 *
 * WHY NO `console.error` BEFORE EXITING:
 *   RedisSMQ captures the worker's stderr and may surface it on the
 *   error path. Adding output here would appear in test logs when the
 *   test fails, which is fine, but would also appear when the test passes
 *   — the worker still exits with a message on stderr regardless of
 *   whether the parent handled it. Silence keeps the pass case clean. If
 *   you need to debug why this fixture is misbehaving, temporarily add a
 *   `console.error` here and revert.
 *
 * WHY `export const a = 6` BEFORE THE EXIT:
 *   The export exists for the same reason as in `faulty.ts`: it makes the
 *   module a valid ES module whose failure is unambiguously the exit, not
 *   a missing-export problem. It appears *before* the `process.exit` call
 *   so that if a future transpiler ever hoists or reorders exports
 *   (unlikely but possible), the file still parses as having an export.
 *
 * DIFFERENCE FROM `faulty.ts`:
 *
 *     faulty.ts        → module evaluates cleanly, has no default export
 *                        → loader rejects after evaluation
 *     faulty-exit.ts   → module evaluation itself terminates the process
 *                        → loader never gets a chance to inspect exports
 *
 *   These fail at different stages. A change that, say, made the loader
 *   inspect exports before evaluating side effects would be caught by
 *   one fixture and not the other. Both are kept for that reason.
 *
 * BUILD NOTE:
 *   RedisSMQ validates the handler filename's extension and requires
 *   `.js` — see `MessageHandlerFilenameExtensionError` in the source. Tests
 *   reference `faulty-exit.js`, and the test build must emit a sibling `.js`
 *   for this file. See `ack.ts` for the full build-note rationale.
 */

/**
 * Present so the module parses as an ES module with content. Not read by
 * any test — the process terminates before anything could consume this
 * value.
 */
export const a = 6;

process.exit(333);
