/**
 * Fixture: async message handler that rejects.
 *
 * Loaded by filename (`.js` after build) via `consumer.consume(queue,
 * '/path/to/async-throw.js')`. Tests that exercise the file-based handler
 * path reference this file to verify RedisSMQ correctly handles the
 * *promise-based* handler signature:
 *
 *     async (msg: IMessageTransferable) => Promise<void>
 *
 * as distinct from the callback-based signature:
 *
 *     (msg: IMessageTransferable, cb: ICallback<void>) => void
 *
 * Behaviour: returns a rejected Promise (via `throw` inside an `async`
 * function). RedisSMQ awaits the returned Promise; on rejection it
 * routes the message through the unacknowledgement pipeline exactly as it
 * would for a callback-reported failure.
 *
 * WHY THIS IS A DISTINCT FIXTURE FROM `throw.ts`:
 *
 *   - Signature: this file takes only the message and returns a Promise;
 *     `throw.ts` takes the message and a callback and returns `void`.
 *
 *   - Failure detection: this file's failure is a *rejected Promise*,
 *     observed by RedisSMQ after the handler returns. `throw.ts`'s
 *     failure is a *synchronous exception*, observed by RedisSMQ
 *     during handler invocation. These are different code paths in the
 *     runner's error handling.
 *
 *   - Regression coverage: a change to RedisSMQ could break the
 *     async-rejection path while leaving the sync-throw path intact
 *     (e.g. removing the `.catch()` on the awaited Promise, or changing
 *     how an async handler's return value is interpreted). Only tests
 *     that load this fixture would fail. That is the reason the two
 *     fixtures are kept separate.
 *
 * SIGNATURE VALIDATION:
 *   RedisSMQ validates the handler's arity at `consume()` time and
 *   rejects unrecognized signatures with `InvalidMessageHandlerSignatureError`.
 *   The required async shape is exactly one parameter (the message). A
 *   zero-argument async function, or a mixed `async (msg, cb)` shape, is
 *   rejected before any message is delivered. This fixture uses the exact
 *   one-argument form so it passes validation and exercises the intended
 *   rejection path.
 *
 * BUILD NOTE:
 *   RedisSMQ validates the handler filename's extension and requires
 *   `.js` — see `MessageHandlerFilenameExtensionError` in the source. Tests
 *   reference `async-throw.js`, and the test build must emit a sibling `.js`
 *   for this file. See `ack.ts` for the full build-note rationale.
 */

import type { IMessageTransferable } from '../../../../src/index.js';

export default async function asyncThrow(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _msg: IMessageTransferable,
): Promise<void> {
  throw new Error('async-throw: simulated async handler failure');
}
