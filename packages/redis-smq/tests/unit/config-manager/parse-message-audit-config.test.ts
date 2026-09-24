/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { errors } from '../../../src/index.js';
import { parseMessageAuditConfig } from '../../../src/core/config-manager/parse-message-audit-config.js';

/**
 * Unit test for `parseMessageAuditConfig`.
 *
 * The parser accepts four input shapes and returns a fully-populated
 * `IMessageAuditParsedConfig` in every case:
 *
 *   - `boolean`   — `true` enables every section with default per-field
 *                   values; `false` disables every section, also with
 *                   defaults for the numeric fields.
 *   - object      — each top-level key may be a boolean (section-level
 *                   toggle) or an object (section-level partial merge).
 *                   A sub-section that is not mentioned falls back to its
 *                   defaults.
 *
 * The full parsed shape (verified from the original test):
 *
 *   {
 *     acknowledgedMessages:      { enabled, expire, queueSize }
 *     deadLetteredMessages:      { enabled, expire, queueSize }
 *     unacknowledgementHistory:  { enabled, maxSize }
 *   }
 *
 * Defaults (from `parseMessageAuditConfig({})`):
 *
 *   acknowledgedMessages:      { enabled: false, expire: 0,     queueSize: 0    }
 *   deadLetteredMessages:      { enabled: false, expire: 0,     queueSize: 0    }
 *   unacknowledgementHistory:  { enabled: false, maxSize: 100                    }
 *
 * The `expected()` helper below takes only the fields that differ from
 * those defaults; every test compares the full parsed object, so a
 * regression that touched a sub-key the author forgot to assert on is
 * still caught.
 *
 * What this file does NOT cover:
 *
 *   - Routing through `parseConfig`. `parse-config.test.ts` verifies that
 *     `parseConfig` reaches this parser and propagates its errors. Testing
 *     it here would duplicate that.
 *
 *   - Persistence. `parseMessageAuditConfig` is a pure function; no Redis
 *     is involved. Tests that write the parsed result live in
 *     `update-config.test.ts` and the config-sync integration tests.
 */

// ---------------------------------------------------------------------------
// Types & fixtures
// ---------------------------------------------------------------------------

/** Input type, derived from the parser's own signature. */
type TInput = Parameters<typeof parseMessageAuditConfig>[0];

/** Output type, derived from the parser's own return. */
type TOutput = ReturnType<typeof parseMessageAuditConfig>;

/**
 * The parser's defaults, expressed once. Every expected value in the
 * table below is derived from this by applying overrides, so the defaults
 * appear in exactly one place in this file.
 *
 * Typed against `TOutput` so a field added to or removed from the parsed
 * shape becomes a compile error here — the intent is that changing the
 * parser's output requires a deliberate update to this constant, not a
 * silent drift.
 */
const DEFAULTS: TOutput = {
  acknowledgedMessages: { enabled: false, expire: 0, queueSize: 0 },
  deadLetteredMessages: { enabled: false, expire: 0, queueSize: 0 },
  unacknowledgementHistory: { enabled: false, maxSize: 100 },
};

/**
 * Build an expected parsed config from partial overrides.
 *
 * Every test in this file goes through this helper, which means every
 * test asserts on the *full* parsed object. A sub-key that no case
 * overrides still gets checked — against its default — on every row.
 * The original test only spot-checked a few fields per case, which is how
 * a regression can slip through a table-driven test that isn't thorough.
 */
function expected(overrides: {
  ack?: Partial<TOutput['acknowledgedMessages']>;
  dl?: Partial<TOutput['deadLetteredMessages']>;
  uh?: Partial<TOutput['unacknowledgementHistory']>;
}): TOutput {
  return {
    acknowledgedMessages: {
      ...DEFAULTS.acknowledgedMessages,
      ...overrides.ack,
    },
    deadLetteredMessages: { ...DEFAULTS.deadLetteredMessages, ...overrides.dl },
    unacknowledgementHistory: {
      ...DEFAULTS.unacknowledgementHistory,
      ...overrides.uh,
    },
  };
}

// ---------------------------------------------------------------------------
// Boolean shorthand
// ---------------------------------------------------------------------------

describe('parseMessageAuditConfig — boolean shorthand', () => {
  it.each<[string, TInput, TOutput]>([
    [
      'false disables every section and zeroes numeric fields',
      false,
      expected({}),
    ],
    [
      'true enables every section with default numeric fields',
      true,
      expected({
        ack: { enabled: true },
        dl: { enabled: true },
        uh: { enabled: true },
      }),
    ],
  ])('%s', (_label, input, exp) => {
    expect(parseMessageAuditConfig(input)).toEqual(exp);
  });
});

// ---------------------------------------------------------------------------
// Object input — section-level toggles
// ---------------------------------------------------------------------------

describe('parseMessageAuditConfig — section-level toggles', () => {
  it.each<[string, TInput, TOutput]>([
    ['empty object yields all defaults', {}, expected({})],
    [
      'acknowledgedMessages: false leaves that section at defaults',
      { acknowledgedMessages: false },
      expected({ ack: { enabled: false } }),
    ],
    [
      'acknowledgedMessages: true enables only that section',
      { acknowledgedMessages: true },
      expected({ ack: { enabled: true } }),
    ],
    [
      'deadLetteredMessages: true enables only that section',
      { deadLetteredMessages: true },
      expected({ dl: { enabled: true } }),
    ],
    [
      'unacknowledgementHistory: true enables only that section',
      { unacknowledgementHistory: true },
      expected({ uh: { enabled: true } }),
    ],
    [
      'acknowledgedMessages: true with deadLetteredMessages: false',
      { acknowledgedMessages: true, deadLetteredMessages: false },
      expected({ ack: { enabled: true } }),
    ],
    [
      'acknowledgedMessages and deadLetteredMessages both true',
      { acknowledgedMessages: true, deadLetteredMessages: true },
      expected({ ack: { enabled: true }, dl: { enabled: true } }),
    ],
    [
      'acknowledgedMessages: false with deadLetteredMessages: true',
      { acknowledgedMessages: false, deadLetteredMessages: true },
      expected({ dl: { enabled: true } }),
    ],
    [
      'acknowledgedMessages: false, deadLetteredMessages: false, unacknowledgementHistory: true',
      {
        acknowledgedMessages: false,
        deadLetteredMessages: false,
        unacknowledgementHistory: true,
      },
      expected({ uh: { enabled: true } }),
    ],
    [
      'unacknowledgementHistory: { enabled: false }',
      { unacknowledgementHistory: { enabled: false } },
      expected({ uh: { enabled: false } }),
    ],
    [
      'unacknowledgementHistory: { enabled: true } keeps default maxSize',
      { unacknowledgementHistory: { enabled: true } },
      expected({ uh: { enabled: true } }),
    ],
  ])('%s', (_label, input, exp) => {
    expect(parseMessageAuditConfig(input)).toEqual(exp);
  });
});

// ---------------------------------------------------------------------------
// Object input — per-section partial merges
// ---------------------------------------------------------------------------

describe('parseMessageAuditConfig — per-section partial merges', () => {
  it.each<[string, TInput, TOutput]>([
    [
      'acknowledgedMessages: { queueSize } keeps other ack fields at defaults',
      { acknowledgedMessages: { queueSize: 10000 } },
      expected({ ack: { queueSize: 10000 } }),
    ],
    [
      'acknowledgedMessages: { expire } keeps other ack fields at defaults',
      { acknowledgedMessages: { expire: 90000 } },
      expected({ ack: { expire: 90000 } }),
    ],
    [
      'acknowledgedMessages: { expire, queueSize } with enabled defaulting to false',
      { acknowledgedMessages: { expire: 90000, queueSize: 10000 } },
      expected({ ack: { expire: 90000, queueSize: 10000 } }),
    ],
    [
      'acknowledgedMessages: {} yields all ack defaults (not "enabled: true")',
      { acknowledgedMessages: {} },
      expected({ ack: {} }),
    ],
    [
      'empty acknowledgedMessages alongside enabled deadLetteredMessages',
      { acknowledgedMessages: {}, deadLetteredMessages: true },
      expected({ dl: { enabled: true } }),
    ],
    [
      'empty acknowledgedMessages with expire override',
      {
        acknowledgedMessages: { expire: 90000 },
        deadLetteredMessages: true,
      },
      expected({ ack: { expire: 90000 }, dl: { enabled: true } }),
    ],
    [
      'ack expire/queueSize and dl enabled/expire/queueSize together',
      {
        acknowledgedMessages: { expire: 90000, queueSize: 10000 },
        deadLetteredMessages: {
          enabled: true,
          expire: 18000,
          queueSize: 20000,
        },
      },
      expected({
        ack: { expire: 90000, queueSize: 10000 },
        dl: { enabled: true, expire: 18000, queueSize: 20000 },
      }),
    ],
    [
      'unacknowledgementHistory: { maxSize } with enabled defaulting to false',
      { unacknowledgementHistory: { maxSize: 900 } },
      expected({ uh: { maxSize: 900 } }),
    ],
    [
      'unacknowledgementHistory: { enabled: true, maxSize: 900 }',
      { unacknowledgementHistory: { enabled: true, maxSize: 900 } },
      expected({ uh: { enabled: true, maxSize: 900 } }),
    ],
  ])('%s', (_label, input, exp) => {
    expect(parseMessageAuditConfig(input)).toEqual(exp);
  });
});

// ---------------------------------------------------------------------------
// Object input — all sections set explicitly
// ---------------------------------------------------------------------------

describe('parseMessageAuditConfig — all sections set', () => {
  it('parses every section with explicit values (no defaults remain)', () => {
    const input = {
      acknowledgedMessages: { enabled: true, expire: 90000, queueSize: 10000 },
      deadLetteredMessages: { enabled: true, expire: 18000, queueSize: 20000 },
      unacknowledgementHistory: { enabled: true, maxSize: 900 },
    };

    expect(parseMessageAuditConfig(input)).toEqual({
      acknowledgedMessages: { enabled: true, expire: 90000, queueSize: 10000 },
      deadLetteredMessages: { enabled: true, expire: 18000, queueSize: 20000 },
      unacknowledgementHistory: { enabled: true, maxSize: 900 },
    });
  });
});

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------

describe('parseMessageAuditConfig — validation errors', () => {
  it.each<[string, TInput, new () => Error]>([
    [
      'rejects a negative acknowledgedMessages.queueSize',
      { acknowledgedMessages: { queueSize: -11 } },
      errors.InvalidMessageAuditQueueSizeError,
    ],
    [
      'rejects a negative acknowledgedMessages.expire',
      { acknowledgedMessages: { expire: -7 } },
      errors.ConfigurationMessageAuditExpireError,
    ],
    [
      'rejects a negative unacknowledgementHistory.maxSize',
      { unacknowledgementHistory: { enabled: false, maxSize: -6 } },
      errors.InvalidMessageAuditHistorySizeError,
    ],
  ])('%s', (_label, input, ErrorClass) => {
    expect(() => parseMessageAuditConfig(input)).toThrow(ErrorClass);
  });
});

// ---------------------------------------------------------------------------
// Purity
// ---------------------------------------------------------------------------

describe('parseMessageAuditConfig — purity', () => {
  it('does not mutate the input object', () => {
    const input = {
      acknowledgedMessages: { enabled: true, queueSize: 500 },
      deadLetteredMessages: { expire: 1000 },
    };
    const snapshot = structuredClone(input);

    parseMessageAuditConfig(input);

    expect(input).toEqual(snapshot);
  });

  it('returns a fresh object on each call', () => {
    // If the parser returned a cached singleton, a caller mutating the
    // result would corrupt every subsequent parse. Each nested section
    // must also be a fresh reference.
    const a = parseMessageAuditConfig({});
    const b = parseMessageAuditConfig({});

    expect(a).not.toBe(b);
    expect(a.acknowledgedMessages).not.toBe(b.acknowledgedMessages);
    expect(a.deadLetteredMessages).not.toBe(b.deadLetteredMessages);
    expect(a.unacknowledgementHistory).not.toBe(b.unacknowledgementHistory);
  });

  it('is deterministic — same input yields equal output', () => {
    const input = {
      acknowledgedMessages: { enabled: true, queueSize: 500 },
    };
    expect(parseMessageAuditConfig(input)).toEqual(
      parseMessageAuditConfig(input),
    );
  });
});
