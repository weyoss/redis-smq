/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EConsoleLoggerLevel } from 'redis-smq-common';
import { parseConfig } from '../../../src/core/config-manager/parse-config.js';
import { errors } from '../../../src/index.js';

/**
 * Unit test for `parseConfig`.
 *
 * `parseConfig` takes a user-supplied configuration object (`IRedisSMQConfig`,
 * all fields optional) and returns a fully-parsed `IRedisSMQParsedConfig` in
 * which every field is populated — either from the input or from the
 * defaults in `default-config.ts`. It is a pure function: no Redis, no side
 * effects on the input, and deterministic output for a given input.
 *
 * The function is a thin composer over three section parsers:
 *
 *   - `parseNamespaceConfig(config.namespace)`
 *   - `parseLoggerConfig(config.logger)`
 *   - `parseMessageAuditConfig(config.messageAudit)`
 *
 * Each section parser is responsible for its own defaults and validation.
 * This file tests the composition — that the right section parser is
 * called with the right input and that its output lands in the right slot.
 * Exhaustive validation of a section's parsing rules belongs to that
 * section's own test file (`parse-message-audit-config.test.ts`).
 *
 * DEFAULTS (from `default-config.ts`):
 *
 *   namespace: 'default'
 *   logger.enabled: false
 *   logger.options.logLevel: EConsoleLoggerLevel.INFO
 *   logger.options.includeTimestamp: true
 *   logger.options.colorize: true
 *   messageAudit.acknowledgedMessages: { enabled: false, queueSize: 0, expire: 0 }
 *   messageAudit.deadLetteredMessages: { enabled: false, queueSize: 0, expire: 0 }
 *   messageAudit.unacknowledgementHistory: { enabled: false, maxSize: 100 }
 *
 * INPUT SHAPE:
 *
 *   `parseConfig` is declared to accept `IRedisSMQConfig`, not a
 *   `Partial<>` of it. That is slightly misleading — every accessor
 *   tolerates `undefined`, so `parseConfig({})` is valid at runtime and
 *   returns a fully-defaulted config. The tests below exercise both the
 *   fully-specified and the empty-input forms.
 */

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

describe('parseConfig — defaults', () => {
  it('produces a complete config object from an empty input', () => {
    const cfg = parseConfig({});

    expect(cfg.namespace).toBe('default');

    expect(cfg.logger.enabled).toBe(false);
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.INFO);
    expect(cfg.logger.options.includeTimestamp).toBe(true);
    expect(cfg.logger.options.colorize).toBe(true);

    expect(cfg.messageAudit.acknowledgedMessages).toEqual({
      enabled: false,
      queueSize: 0,
      expire: 0,
    });
    expect(cfg.messageAudit.deadLetteredMessages).toEqual({
      enabled: false,
      queueSize: 0,
      expire: 0,
    });
    expect(cfg.messageAudit.unacknowledgementHistory).toEqual({
      enabled: false,
      maxSize: 100,
    });
  });

  it('is deterministic — same input yields equal output', () => {
    expect(parseConfig({})).toEqual(parseConfig({}));
  });
});

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

describe('parseConfig — logger', () => {
  it('parses a fully-specified logger section', () => {
    const cfg = parseConfig({
      logger: {
        enabled: true,
        options: {
          logLevel: EConsoleLoggerLevel.DEBUG,
          includeTimestamp: false,
          colorize: false,
        },
      },
    });

    expect(cfg.logger.enabled).toBe(true);
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.DEBUG);
    expect(cfg.logger.options.includeTimestamp).toBe(false);
    expect(cfg.logger.options.colorize).toBe(false);
  });

  it('fills unset logger.options fields from defaults', () => {
    // Only `enabled` is provided; every other logger field comes from
    // `default-config.ts`.
    const cfg = parseConfig({ logger: { enabled: true } });

    expect(cfg.logger.enabled).toBe(true);
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.INFO);
    expect(cfg.logger.options.includeTimestamp).toBe(true);
    expect(cfg.logger.options.colorize).toBe(true);
  });

  it('accepts the boolean shorthand and preserves options defaults', () => {
    // `logger: false` disables logging but does NOT reset the options.
    // This distinguishes logger config from messageAudit config: in
    // messageAudit, a boolean resets every numeric sibling; in logger,
    // the options sub-object survives.
    const cfg = parseConfig({ logger: false });

    expect(cfg.logger.enabled).toBe(false);
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.INFO);
    expect(cfg.logger.options.includeTimestamp).toBe(true);
    expect(cfg.logger.options.colorize).toBe(true);
  });

  it('accepts the true boolean shorthand', () => {
    const cfg = parseConfig({ logger: true });

    expect(cfg.logger.enabled).toBe(true);
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.INFO);
  });
});

// ---------------------------------------------------------------------------
// messageAudit — routing to parseMessageAuditConfig
// ---------------------------------------------------------------------------

describe('parseConfig — messageAudit', () => {
  it('accepts the boolean shorthand and produces the parsed object', () => {
    // `messageAudit: true` routes to `parseMessageAuditConfig(true)`,
    // which enables every section with per-field defaults. Same contract
    // as `parse-message-audit-config.test.ts` asserts directly.
    const cfg = parseConfig({ messageAudit: true });

    expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
    expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(true);
    expect(cfg.messageAudit.unacknowledgementHistory.enabled).toBe(true);

    // Numeric fields stay at their defaults — the boolean only toggles
    // `enabled`.
    expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(0);
    expect(cfg.messageAudit.acknowledgedMessages.expire).toBe(0);
    expect(cfg.messageAudit.unacknowledgementHistory.maxSize).toBe(100);
  });

  it('accepts an object and merges with defaults per section', () => {
    const cfg = parseConfig({
      messageAudit: {
        acknowledgedMessages: { queueSize: 12345 },
      },
    });

    // Only queueSize was set for acknowledgedMessages; the other fields
    // fall back to their defaults, and the sibling sections remain at
    // their defaults entirely.
    expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(12345);
    expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(false);
    expect(cfg.messageAudit.acknowledgedMessages.expire).toBe(0);

    expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(false);
    expect(cfg.messageAudit.unacknowledgementHistory.enabled).toBe(false);
    expect(cfg.messageAudit.unacknowledgementHistory.maxSize).toBe(100);
  });

  it('propagates InvalidMessageAuditQueueSizeError from the section parser', () => {
    // The point of this test is not to re-verify the validation (covered
    // exhaustively in `parse-message-audit-config.test.ts`) but to confirm
    // `parseConfig` does not swallow or wrap the error.
    expect(() =>
      parseConfig({
        messageAudit: { acknowledgedMessages: { queueSize: -1 } },
      }),
    ).toThrow(errors.InvalidMessageAuditQueueSizeError);
  });

  it('propagates ConfigurationMessageAuditExpireError', () => {
    expect(() =>
      parseConfig({
        messageAudit: { acknowledgedMessages: { expire: -1 } },
      }),
    ).toThrow(errors.ConfigurationMessageAuditExpireError);
  });

  it('propagates InvalidMessageAuditHistorySizeError', () => {
    expect(() =>
      parseConfig({
        messageAudit: {
          unacknowledgementHistory: { enabled: true, maxSize: -1 },
        },
      }),
    ).toThrow(errors.InvalidMessageAuditHistorySizeError);
  });
});

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

describe('parseConfig — composition', () => {
  it('parses multiple sections independently', () => {
    const cfg = parseConfig({
      namespace: 'my-app',
      logger: {
        enabled: true,
        options: { logLevel: EConsoleLoggerLevel.INFO },
      },
      messageAudit: {
        acknowledgedMessages: { enabled: true, queueSize: 100 },
        deadLetteredMessages: { enabled: true },
      },
    });

    // Each section reflects its own input.
    expect(cfg.namespace).toBe('my-app');
    expect(cfg.logger.enabled).toBe(true);
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.INFO);
    expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
    expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(100);
    expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(true);

    // Siblings that were not explicitly set survive at their defaults.
    expect(cfg.messageAudit.unacknowledgementHistory.enabled).toBe(false);
    expect(cfg.messageAudit.unacknowledgementHistory.maxSize).toBe(100);
  });

  it('does not cross-contaminate section inputs', () => {
    // Passing only `logger` must leave namespace and messageAudit at
    // their defaults — the section parsers must not read from each
    // other's slot.
    const cfg = parseConfig({ logger: { enabled: true } });

    expect(cfg.namespace).toBe('default');
    expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(false);
    expect(cfg.messageAudit.unacknowledgementHistory.maxSize).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

describe('parseConfig — input handling', () => {
  it('does not mutate the input object', () => {
    const input = {
      namespace: 'my-app',
      logger: { enabled: true },
      messageAudit: { acknowledgedMessages: { queueSize: 500 } },
    };
    const snapshot = structuredClone(input);

    parseConfig(input);

    expect(input).toEqual(snapshot);
  });

  it('returns a fresh top-level object on each call', () => {
    // If parseConfig returned a cached singleton, a caller mutating the
    // result would corrupt every subsequent parse. RedisSMQ relies
    // on each call producing a detached object; `ConfigManager.updateConfig`
    // in particular passes the parsed result to `Configuration.save`,
    // which then mutates the stored config.
    const a = parseConfig({});
    const b = parseConfig({});

    expect(a).not.toBe(b);
    expect(a.messageAudit).not.toBe(b.messageAudit);
    expect(a.logger).not.toBe(b.logger);
  });

  it('does not share references between input and output sub-objects', () => {
    // The section parsers build fresh objects via `_.merge({}, default,
    // userConfig)` and `{ ...default, ...config }`, so a mutation on the
    // result must not flow back into the caller's input.
    const input = { logger: { enabled: true } };
    const cfg = parseConfig(input);

    // Mutate the output; the input must be unchanged.
    cfg.logger.enabled = false;
    cfg.logger.options.colorize = false;

    expect(input.logger.enabled).toBe(true);
    expect(
      (input.logger as { options?: { colorize?: boolean } }).options,
    ).toBeUndefined();
  });
});
