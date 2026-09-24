/**
 * Fixture: auto-acknowledging message handler.
 *
 * Loaded by filename (`.js` after build) via `consumer.consume(queue,
 * '/path/to/ack.js')`. Tests that exercise the file-based handler path
 * reference this file to verify that RedisSMQ loads a worker, invokes
 * it with a message, and processes the callback's outcome.
 *
 * Behaviour: calls `cb()` with no error, which RedisSMQ interprets as
 * "acknowledge this message". The message moves to the acknowledged list.
 *
 * BUILD NOTE:
 *   RedisSMQ validates the handler filename's extension and requires
 *   `.js` — see `MessageHandlerFilenameExtensionError` in the source. That
 *   means the tests reference `ack.js`, not `ack.ts`, and the test build
 *   must emit a sibling `.js` for this file. If your build already emits
 *   `.js` alongside `.ts` (as the other fixture workers require — see
 *   `crash-consumer.worker.ts`), no extra configuration is needed. If you
 *   see `MessageHandlerFileError` at test time, the build is not emitting
 *   the fixture.
 *
 * WHY `IMessageTransferable` AND NOT `IMessageParams`:
 *   RedisSMQ passes the full transferable message to handlers — it
 *   includes the message state (`status`, `processingStartedAt`, `attempts`,
 *   etc.) in addition to the message parameters. Several of the original
 *   fixture files used `IMessageParams` here, which type-checked only
 *   because the handler ignores the extra fields; the correct type is
 *   `IMessageTransferable`. Using the narrower type would silently miss
 *   property access errors in fixtures that do read message state.
 */

import type { ICallback } from 'redis-smq-common';
import type { IMessageTransferable } from '../../../../src/index.js';

export default function ack(
  _msg: IMessageTransferable,
  cb: ICallback<void>,
): void {
  cb();
}
