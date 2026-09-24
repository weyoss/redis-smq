/**
 * Fixture: module that loads but exports no handler.
 *
 * Loaded by filename (`.js` after build) via `consumer.consume(queue,
 * '/path/to/faulty.js')`. Tests that exercise the file-based handler path
 * reference this file to verify RedisSMQ rejects a *structurally
 * invalid* handler module — one that imports cleanly but whose default
 * export is not a function.
 *
 * Behaviour: the module has no default export. When RedisSMQ imports
 * it and looks for the handler, it finds nothing callable and rejects the
 * `consume()` call. The exact error class depends on RedisSMQ's
 * loader; in this codebase it surfaces as `MessageHandlerFileError` (see
 * the exception taxonomy in `src/` for the authoritative list).
 *
 * WHY NO DEFAULT EXPORT:
 *   The absence is the point of the fixture. Adding a no-op default export
 *   would turn this into `ack.ts` with a different filename, and the
 *   loader's "invalid module shape" branch would never be exercised. Do
 *   not "fix" this file by adding a default export.
 *
 * WHY A NAMED EXPORT (`const a = 6`):
 *   The named export ensures the module is a *valid ES module* with real
 *   content — it loads cleanly and evaluates without error. This
 *   distinguishes the fixture from `faulty-exit.ts`, where module
 *   evaluation itself fails. The two fixtures fail at different stages:
 *
 *     faulty.ts        → module loads, has no handler  → loader rejects
 *     faulty-exit.ts   → module evaluation crashes     → worker dies
 *
 *   A future refactor that made the loader import and check the module
 *   before evaluating it (rather than after) would be caught by whichever
 *   fixture corresponds to the loader's new ordering, not silently passed
 *   by both.
 *
 * BUILD NOTE:
 *   RedisSMQ validates the handler filename's extension and requires
 *   `.js` — see `MessageHandlerFilenameExtensionError` in the source. Tests
 *   reference `faulty.js`, and the test build must emit a sibling `.js` for
 *   this file. See `ack.ts` for the full build-note rationale.
 */

/**
 * Present so the module evaluates without error and has at least one export.
 * The value is arbitrary — tests do not read it. Its only role is to make
 * this a valid ES module that loads cleanly, so the failure is the missing
 * default export and nothing else.
 */
export const a = 6;
