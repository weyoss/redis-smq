/**
 * Timing assertions for tests.
 *
 * The test suite has many assertions of the form "these two timestamps
 * should be within N milliseconds of each other" — scheduled delays firing
 * on time, retries spaced by retryDelay, batched operations completing
 * together, and so on. These are inherently fuzzy: RedisSMQ targets a
 * precise delay, but real scheduling, Redis round-trips, worker tick
 * intervals, and CI load all introduce drift.
 *
 * `expectTimeNear` is the assertion for those cases. It replaces the old
 * boolean-returning `validateTime` helper because:
 *
 *   - A boolean return forces `expect(validateTime(...)).toBe(true)`, which
 *     fails with "expected false to be true" — useless for debugging.
 *   - A boolean return hides the actual numeric drift, which is the first
 *     thing you want to know when a timing test flakes.
 *   - The old signature took positional `(actual, expected, tolerance)`,
 *     easy to misread as `(expected, actual, tolerance)` since both are
 *     numbers.
 *
 * `expectTimeNear` never returns a value — it asserts and moves on. If you
 * need the drift for a further assertion, call `timeDrift` directly.
 */

import { expect } from 'vitest';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default tolerance for timing assertions, in milliseconds.
 *
 * 3000ms matches the old `validateTime` default and reflects real-world
 * drift on CI: a worker tick interval, a couple of Redis round-trips, and
 * scheduler jitter routinely add up to 1–2 seconds under load. Tighter
 * tolerances here would fail on CI machines doing nothing wrong.
 *
 * Tests that assert on operations with tighter deadlines (batch
 * acknowledgement, in-process event propagation) should pass an explicit
 * `toleranceMs` — the default is calibrated for cross-process scheduling,
 * not for in-memory timing.
 */
export const DEFAULT_TIME_TOLERANCE_MS = 3000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IExpectTimeNearOptions {
  /** Tolerance in milliseconds. Defaults to `DEFAULT_TIME_TOLERANCE_MS`. */
  toleranceMs?: number;
  /**
   * Extra context included in the failure message. Use when the assertion
   * appears inside a loop or a parameterized test and the raw numbers
   * don't identify which iteration failed.
   */
  description?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Absolute difference between two timestamps, in milliseconds.
 *
 * Exposed because some tests want to reason about the drift before
 * asserting — e.g. logging it, or asserting on a range of drifts across
 * multiple samples. For a single comparison, use `expectTimeNear` directly.
 */
export function timeDrift(actual: number, expected: number): number {
  return Math.abs(actual - expected);
}

/**
 * Assert that `actual` is within `toleranceMs` of `expected`.
 *
 * Both values are treated as arbitrary timestamps (typically epoch-ms
 * deltas), so the assertion is symmetric: `expectTimeNear(a, b)` and
 * `expectTimeNear(b, a)` have identical outcomes. There is no "actual
 * should be later than expected" semantics — for that, use a direct
 * comparison.
 *
 * On failure, the error message includes:
 *   - actual and expected values (so you can see which direction the
 *     drift went and by how much)
 *   - the computed drift
 *   - the tolerance that was exceeded
 *
 * Example:
 *
 *   const publishedAt = msg.messageState.publishedAt ?? 0;
 *   expectTimeNear(publishedAt - producedAt, 10_000, { toleranceMs: 1500 });
 */
export function expectTimeNear(
  actual: number,
  expected: number,
  options: IExpectTimeNearOptions = {},
): void {
  const toleranceMs = options.toleranceMs ?? DEFAULT_TIME_TOLERANCE_MS;
  const drift = timeDrift(actual, expected);

  const base =
    `actual=${actual}ms, expected=${expected}ms, ` +
    `drift=${drift}ms, tolerance=${toleranceMs}ms`;
  const message = options.description
    ? `${options.description}: ${base}`
    : base;

  // Vitest's `expect` accepts a message as its second argument, which is
  // surfaced verbatim on failure. The matcher itself compares the drift, so
  // the diff line shows the two numbers a reader actually cares about —
  // drift and tolerance — rather than the two raw timestamps.
  expect(drift, message).toBeLessThanOrEqual(toleranceMs);
}

/**
 * Assert that `actual` is within `DEFAULT_TIME_TOLERANCE_MS` of
 * `expected`, using `description` as the failure message prefix.
 *
 * A thin positional-argument wrapper around `expectTimeNear` for the
 * common case where the caller wants the default tolerance and only
 * needs to name the measurement. `expectTimeNear`'s options object is
 * the general form; this is the shape most call sites reach for.
 *
 * The name reflects the primary use — measuring the gap between two
 * timestamps — but the function is a general near-equality assertion
 * for two numeric values. `expectTimeNear` is the more accurate name
 * for the general case; `expectGapNear` is the one the rate-limiting
 * tests use, where each call compares a measured inter-delivery gap
 * against a configured rate-limit interval.
 *
 * The description is optional. When omitted, the failure message is
 * just the numeric context (`actual=…, expected=…, drift=…,
 * tolerance=…`) with no prefix. Callers in the rate-limiting tests
 * pass a description because a bare diff is not enough to identify
 * which of several gap assertions in the same test failed.
 */
export function expectGapNear(
  actual: number,
  expected: number,
  description?: string,
): void {
  expectTimeNear(actual, expected, {
    toleranceMs: DEFAULT_TIME_TOLERANCE_MS,
    description,
  });
}
