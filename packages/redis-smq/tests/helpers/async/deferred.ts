/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * A Promise with its resolver extracted, for the "signal from inside
 * a callback" pattern that several tests need.
 *
 * The common shape across the suite is a handler — or consumer, or
 * producer — that must signal the test at a specific moment (handler
 * entry, callback capture, message checkout) without the test polling
 * or waiting a fixed delay. `deferred()` makes that signal
 * expressible as a Promise the test can `await`:
 *
 *     const { promise, notify } = deferred();
 *     const consumer = await getConsumer({
 *       queue,
 *       messageHandler: (_msg, cb) => {
 *         notify();          // signal the test
 *         // ... do not call cb yet — hold the message in flight ...
 *       },
 *     });
 *     await consumer.run();
 *     await promise;         // resolves the instant the handler ran
 *
 * The alternative — a fixed `setTimeout` — is wrong in both
 * directions: too short on a loaded CI (the handler has not run yet,
 * the test races it), too long on a fast machine (the test wastes the
 * entire delay). The deferred resolves the instant the signal fires,
 * regardless of how long that took.
 *
 * WHY `notify` IS INITIALIZED TO A NO-OP:
 *
 *   The Promise executor runs synchronously, so `notify` is assigned
 *   to the real resolver before `deferred()` returns. But
 *   TypeScript's definite-assignment analysis cannot prove that, and
 *   would reject the `notify` reference as possibly-undefined.
 *   Initializing to a no-op satisfies the compiler without changing
 *   runtime behavior: the no-op is never called, because the executor
 *   has already overwritten it by the time the function returns.
 *
 *   This workaround appeared verbatim in six separate test files
 *   before the helper was extracted. Extracting it here makes the
 *   explanation visible once and lets the call sites read as plain
 *   "signal from the handler" code.
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * The pair returned by `deferred()`: the Promise to await and the
 * function that resolves it.
 *
 * Callers destructure both: `const { promise, notify } = deferred()`.
 */
export interface IDeferred {
  /** Resolves when `notify()` is called. Never rejects. */
  promise: Promise<void>;
  /**
   * Resolves `promise`. Idempotent — `Promise` resolution semantics
   * make subsequent calls no-ops, so a caller that might resolve
   * twice (a handler that signals on entry and again on completion)
   * does not need to guard the call.
   */
  notify: () => void;
}

/**
 * Create a Promise with its resolver extracted.
 *
 * See the file header for the intended usage pattern and why a fixed
 * delay is not a suitable substitute.
 *
 * The returned `promise` is `Promise<void>` — the signal carries no
 * value. A test that needs to pass data from the callback to the
 * awaiting code captures it in a local variable before calling
 * `notify()`; the ordering guarantee is that `notify` is invoked
 * after the capture, so the awaiting code observes the captured
 * value.
 */
export function deferred(): IDeferred {
  let notify: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    notify = resolve;
  });
  return { promise, notify };
}
