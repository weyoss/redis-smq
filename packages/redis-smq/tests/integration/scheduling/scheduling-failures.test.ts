/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { errors, RedisSMQ } from '../../../src/index.js';

/**
 * Integration tests for scheduling-specific validation failures.
 *
 * Only one validation failure is specific to scheduling: a malformed
 * CRON expression passed to `setScheduledCRON`. It runs on the
 * `ProducibleMessage` builder, synchronously, before the message is
 * handed to `produce`.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling validation failures', () => {
  describe('setScheduledCRON', () => {
    // -----------------------------------------------------------------------
    // Rejection — wrong field count
    // -----------------------------------------------------------------------

    describe('rejects expressions with the wrong field count', () => {
      it.each<[string, string]>([
        ['a single field', '*'],
        ['two fields', '* *'],
        ['three fields', '* * *'],
        ['four fields', '* * * *'],
        ['seven fields', '* * * * * * *'],
        ['eight fields', '* * * * * * * *'],
      ])('rejects %s', (_label, expression) => {
        // The field-count check runs before the parser. An expression
        // with the wrong number of fields fails here regardless of
        // whether the fields would parse individually.
        const msg = RedisSMQ.newProducibleMessage();
        expect(() => msg.setScheduledCRON(expression)).toThrow(
          errors.InvalidCronExpressionError,
        );
      });
    });

    // -----------------------------------------------------------------------
    // Rejection — right field count, invalid content
    // -----------------------------------------------------------------------

    describe('rejects expressions that fail to parse', () => {
      it.each<[string, string]>([
        ['an empty string', ''],
        ['whitespace only', '   '],
        ['letters in a numeric field', 'a * * * * *'],
        ['an out-of-range second value', '60 * * * * *'],
        ['an out-of-range minute value', '0 60 * * * *'],
        ['an out-of-range hour value', '0 0 24 * * *'],
        [
          'garbage that happens to have the right field count',
          'not a cron at all',
        ],
      ])('rejects an expression with %s', (_label, expression) => {
        // The empty and whitespace-only cases are interesting: `trim()`
        // reduces them to `''`, then `split(/\s+/)` produces `['']` with
        // length 1, which fails the field-count check. They reach the
        // same error class as the other field-count failures.
        const msg = RedisSMQ.newProducibleMessage();
        expect(() => msg.setScheduledCRON(expression)).toThrow(
          errors.InvalidCronExpressionError,
        );
      });
    });

    // -----------------------------------------------------------------------
    // Acceptance
    // -----------------------------------------------------------------------

    describe('accepts valid expressions', () => {
      it.each<[string, string]>([
        ['5-field: every minute', '* * * * *'],
        ['5-field: at 09:30 on weekdays', '30 9 * * 1-5'],
        ['5-field: hourly, on the hour', '0 * * * *'],
        ['6-field: every second', '* * * * * *'],
        ['6-field: every 6 seconds', '*/6 * * * * *'],
        ['6-field: at midnight, second 0, minute 30', '0 30 0 * * *'],
      ])('accepts %s', (_label, expression) => {
        const msg = RedisSMQ.newProducibleMessage();
        expect(() => msg.setScheduledCRON(expression)).not.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // Rejection is not sticky
    // -----------------------------------------------------------------------

    it('allows a valid expression after a rejected one', async () => {
      const msg = RedisSMQ.newProducibleMessage();

      expect(() => msg.setScheduledCRON('bad expression')).toThrow(
        errors.InvalidCronExpressionError,
      );

      // The rejected call must not have set the field. `getScheduledCRON`
      // returns null when no valid expression has been set.
      expect(msg.getScheduledCRON()).toBeNull();

      // The subsequent valid call succeeds and sets the field.
      expect(() => msg.setScheduledCRON('*/6 * * * * *')).not.toThrow();
      expect(msg.getScheduledCRON()).toBe('*/6 * * * * *');
    });
  });
});
