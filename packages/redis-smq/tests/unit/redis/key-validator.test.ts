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
import { validateRedisKey } from '../../../src/core/common/redis/keys/validator.js';

/**
 * Unit test for `validateRedisKey`.
 *
 * The validator guards user-facing identifiers that become parts of Redis
 * keys — namespaces and queue names — against characters that would
 * confuse the key builder.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assert the validator rejected the input, and return the error instance
 * for further inspection.
 *
 * The cast on `input` is from `unknown` to the validator's declared
 * parameter type. It exists so the tables below can include non-string
 * inputs without each row needing a cast of its own; the caveat is
 * documented in the file header.
 */
function expectInvalid(input: unknown): errors.InvalidRedisKeyError {
  const result = validateRedisKey(input as string);
  expect(result).toBeInstanceOf(errors.InvalidRedisKeyError);
  return result as errors.InvalidRedisKeyError;
}

/**
 * Assert the validator accepted the input, and return the normalized
 * (lowercase) key.
 */
function expectValid(input: string): string {
  const result = validateRedisKey(input);
  expect(result).not.toBeInstanceOf(errors.InvalidRedisKeyError);
  return result as string;
}

// ---------------------------------------------------------------------------
// Rejection — missing or empty input
// ---------------------------------------------------------------------------

describe('validateRedisKey — rejects missing input', () => {
  it.each<[string, unknown]>([
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_label, input) => {
    expectInvalid(input);
  });
});

// ---------------------------------------------------------------------------
// Rejection — invalid characters
// ---------------------------------------------------------------------------

describe('validateRedisKey — rejects forbidden characters', () => {
  it.each<[string, string]>([
    // Colons are the primary concern — the validator's reason for
    // existing is that user identifiers must not clash with the
    // segment separator used by `keys/builder.ts`.
    ['a colon', 'ns:queue'],
    ['a colon in the middle', 'a:b:c'],

    // Other punctuation outside the allowed set.
    ['a slash', 'a/b'],
    ['a space', 'a b'],
    ['a tab', 'a\tb'],
    ['a newline', 'a\nb'],
    ['an at sign', 'a@b'],
    ['a hash', 'a#b'],
    ['a star', 'a*b'],
    ['square brackets', 'a[b]'],
    ['parentheses', 'a(b)'],

    // Non-ASCII letters.
    ['an accented letter', 'aé'],
    ['Cyrillic characters', 'ключ'],
  ])('rejects a key containing %s', (_label, input) => {
    expectInvalid(input);
  });

  it.each<[string, string]>([
    ['whitespace only (single space)', ' '],
    ['whitespace only (multiple spaces)', '   '],
    ['a tab only', '\t'],
    ['a newline only', '\n'],
  ])('rejects %s', (_label, input) => {
    // Whitespace-only strings pass the length check (length >= 1) and
    // fail the regex at the first-character position. Distinct from the
    // empty-string case above, which fails at the length check.
    expectInvalid(input);
  });
});

// ---------------------------------------------------------------------------
// Rejection — invalid first character
// ---------------------------------------------------------------------------

describe('validateRedisKey — rejects keys that do not start with a letter', () => {
  it.each<[string, string]>([
    ['a leading digit', '1a'],
    ['a leading digit sequence', '123'],
    ['a leading hyphen', '-a'],
    ['a leading underscore', '_a'],
    ['a leading dot', '.a'],
    ['a leading colon', ':a'],
  ])('rejects a key with %s', (_label, input) => {
    expectInvalid(input);
  });
});

// ---------------------------------------------------------------------------
// Rejection — non-string input (type-signature-violating)
// ---------------------------------------------------------------------------

describe('validateRedisKey — rejects most non-string input', () => {
  // The TypeScript signature is `string | null | undefined`; these inputs
  // are only reachable from untyped JavaScript callers. They are all
  // caught by the `!key?.length` guard: numbers, objects, booleans, and
  // symbols have `undefined` for `.length`, and an empty array has
  // `.length === 0`.
  //
  // A non-empty array is the one exception — see KNOWN LIMITATION in the
  // file header. It is deliberately not included in this table.
  it.each<[string, unknown]>([
    ['a positive number', 123],
    ['zero', 0],
    ['an object', {}],
    ['a boolean true', true],
    ['a boolean false', false],
    ['an empty array', []],
  ])('rejects %s', (_label, input) => {
    expectInvalid(input);
  });
});

// ---------------------------------------------------------------------------
// Acceptance
// ---------------------------------------------------------------------------

describe('validateRedisKey — accepts valid identifiers', () => {
  it.each<[string, string]>([
    ['a single letter', 'a'],
    ['a lowercase word', 'test'],
    ['letters followed by a digit', 'ns1'],
    ['a hyphen-separated name', 'my-queue'],
    ['an underscore-separated name', 'my_queue'],
    ['a dot-separated name', 'my.queue'],
    ['a mixed-separator name', 'a-b_c.d'],
    ['a name ending in a digit', 'queue1'],
    ['a name mixing all allowed characters', 'a-b_c.d1'],
    ['a 500-character name', 'a'.repeat(500)],
  ])('accepts %s', (_label, input) => {
    // For already-lowercase inputs, the normalization is a no-op and the
    // returned value is content-equal to the input.
    expect(expectValid(input)).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

describe('validateRedisKey — lowercases on acceptance', () => {
  it.each<[string, string, string]>([
    ['a single uppercase letter', 'A', 'a'],
    ['an uppercase word', 'ABC', 'abc'],
    ['mixed case', 'aBcDeF', 'abcdef'],
    ['mixed case with separators', 'My-Queue_Name', 'my-queue_name'],
    ['mixed case with digits and dots', 'NS1.Some_Name', 'ns1.some_name'],
  ])('lowercases %s', (_label, input, expected) => {
    // The validator's contract is to *return* the normalized key, not
    // merely to accept or reject. Callers use the return value as the
    // canonical identifier. A change to preserve case would silently
    // change every namespace and queue name in Redis — callers that
    // compared the returned key to a stored key would start failing.
    expect(expectValid(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Return-value contract
// ---------------------------------------------------------------------------

describe('validateRedisKey — return-value contract', () => {
  it('does not throw on invalid input', () => {
    // The single most important assertion in this file. Every caller in
    // the source reads the return value rather than catching a throw. A
    // refactor to the throwing style would pass every other test in this
    // file and only surface as a production bug the next time an invalid
    // key was constructed.
    expect(() => validateRedisKey('')).not.toThrow();
    expect(() => validateRedisKey(null)).not.toThrow();
    expect(() => validateRedisKey(undefined)).not.toThrow();
    expect(() => validateRedisKey('bad:key')).not.toThrow();
    expect(() => validateRedisKey('1leading-digit')).not.toThrow();
  });

  it('does not throw on valid input', () => {
    expect(() => validateRedisKey('validkey')).not.toThrow();
  });

  it('returns a distinct error instance on rejection, not a shared singleton', () => {
    // If the validator returned a cached error instance, two call sites
    // that both captured it would share state — a later
    // `Error.captureStackTrace` or a property mutation on one would
    // affect the other. The source uses `new InvalidRedisKeyError()` on
    // every failure path, so each rejection produces a fresh instance.
    const a = validateRedisKey('');
    const b = validateRedisKey('');

    expect(a).toBeInstanceOf(errors.InvalidRedisKeyError);
    expect(b).toBeInstanceOf(errors.InvalidRedisKeyError);
    expect(a).not.toBe(b);
  });
});
