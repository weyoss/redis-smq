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
import { RedisSMQ } from '../../../src/index.js';

/**
 * Unit test for `ConfigManager.updateConfig`'s nested-merge semantics.
 *
 * The contract under test:
 *
 *   - `updateConfig` accepts a partial config and merges it into the current
 *     configuration.
 *   - The merge is nested. Passing `{ messageAudit: { deadLetteredMessages:
 *     true } }` updates only that sub-key and leaves the other
 *     `messageAudit` siblings untouched.
 *   - A boolean passed in place of an object *replaces* the section rather
 *     than merging into it. Every sub-key of the replaced section resets to
 *     its parsed default.
 *
 * What this file does NOT cover:
 *
 *   - Persistence. `updateConfig` writes to Redis so other processes can
 *     observe the change (see `integration/system/config-sync.test.ts` for
 *     the cross-process behavior). This file only reads back through
 *     `getConfig()`, which reflects the in-process view. A regression that
 *     broke Redis persistence but preserved the in-memory merge would pass
 *     here and fail the config-sync test — that is the intended split.
 *
 *   - Input validation. Malformed input that `parseConfig` /
 *     `parseMessageAuditConfig` should reject is exercised in
 *     `parse-config.test.ts` and `parse-message-audit-config.test.ts`. If
 *     `updateConfig` correctly routes through the parser (as the "boolean
 *     replaces" test asserts), those validators are the ones to fix, not
 *     these tests.
 *
 * Setup assumptions:
 *
 *   `RedisSMQ.createConfigManager()` requires RedisSMQ to be initialized.
 *   `test/setup/per-test.ts` handles that before each test, and also calls
 *   `applyTestDefaults()` which resets config to the test defaults. Every
 *   test in this file therefore starts from:
 *
 *     messageAudit.acknowledgedMessages.enabled      === true
 *     messageAudit.deadLetteredMessages.enabled      === true
 *     messageAudit.unacknowledgementHistory.enabled  === true
 *     logger.enabled                                 === false
 *     logger.options.logLevel                        === 'DEBUG'
 *
 *   Tests below change those values; they rely on the reset for isolation
 *   and must not be re-run without it. Removing the reset from the setup
 *   would make every test in this file order-dependent.
 */

describe('ConfigManager.updateConfig', () => {
  // -------------------------------------------------------------------------
  // messageAudit — nested merge
  // -------------------------------------------------------------------------

  describe('messageAudit', () => {
    it('preserves acknowledgedMessages sub-keys when a sibling section is updated', async () => {
      const cm = RedisSMQ.createConfigManager();

      // Establish a known state for acknowledgedMessages with all three
      // sub-keys set to non-default values.
      await cm.updateConfig({
        messageAudit: {
          acknowledgedMessages: {
            enabled: true,
            queueSize: 5000,
            expire: 3600,
          },
        },
      });

      let cfg = cm.getConfig();
      expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
      expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(5000);
      expect(cfg.messageAudit.acknowledgedMessages.expire).toBe(3600);

      // Update a *different* sub-key of messageAudit. The merged result must
      // retain everything set above for acknowledgedMessages.
      await cm.updateConfig({
        messageAudit: { deadLetteredMessages: true },
      });

      cfg = cm.getConfig();
      expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
      expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(5000);
      expect(cfg.messageAudit.acknowledgedMessages.expire).toBe(3600);
      expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(true);
    });

    it('replaces the entire messageAudit section when passed a boolean', async () => {
      const cm = RedisSMQ.createConfigManager();

      // Enable audit and set a non-default queue size on acknowledgedMessages,
      // so we can distinguish "section was reset" from "section was left
      // alone".
      await cm.updateConfig({
        messageAudit: {
          acknowledgedMessages: { enabled: true, queueSize: 5000 },
        },
      });

      let cfg = cm.getConfig();
      expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
      expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(5000);

      // A boolean replaces, it does not merge. Every sub-key must reset to
      // the parsed default — not merely have `enabled` flipped while
      // queueSize/expire carry over from the previous config.
      await cm.updateConfig({ messageAudit: false });

      cfg = cm.getConfig();

      expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(false);
      expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(0);
      expect(cfg.messageAudit.acknowledgedMessages.expire).toBe(0);

      expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(false);
      expect(cfg.messageAudit.deadLetteredMessages.queueSize).toBe(0);
      expect(cfg.messageAudit.deadLetteredMessages.expire).toBe(0);

      expect(cfg.messageAudit.unacknowledgementHistory.enabled).toBe(false);
      expect(cfg.messageAudit.unacknowledgementHistory.maxSize).toBe(100);
    });

    it('merges each messageAudit sibling independently', async () => {
      const cm = RedisSMQ.createConfigManager();

      // Set all three siblings, each with a distinguishing value, so a
      // regression that overwrote the wrong sibling would be visible.
      await cm.updateConfig({
        messageAudit: {
          acknowledgedMessages: { enabled: true, queueSize: 111 },
          deadLetteredMessages: { enabled: true, queueSize: 222 },
          unacknowledgementHistory: { enabled: true, maxSize: 333 },
        },
      });

      // Update only unacknowledgementHistory. The other two must be
      // preserved with all their fields intact.
      await cm.updateConfig({
        messageAudit: {
          unacknowledgementHistory: { enabled: false, maxSize: 444 },
        },
      });

      const cfg = cm.getConfig();

      // acknowledgedMessages: untouched.
      expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
      expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(111);

      // deadLetteredMessages: untouched.
      expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(true);
      expect(cfg.messageAudit.deadLetteredMessages.queueSize).toBe(222);

      // unacknowledgementHistory: updated.
      expect(cfg.messageAudit.unacknowledgementHistory.enabled).toBe(false);
      expect(cfg.messageAudit.unacknowledgementHistory.maxSize).toBe(444);
    });
  });

  // -------------------------------------------------------------------------
  // logger — nested merge
  // -------------------------------------------------------------------------

  describe('logger', () => {
    it('preserves logger.enabled and logLevel when only options.colorize is updated', async () => {
      const cm = RedisSMQ.createConfigManager();

      // Enable the logger and set a non-default log level.
      await cm.updateConfig({
        logger: {
          enabled: true,
          options: { logLevel: EConsoleLoggerLevel.DEBUG },
        },
      });

      let cfg = cm.getConfig();
      expect(cfg.logger.enabled).toBe(true);
      expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.DEBUG);

      // Update only the colorize option. Everything else must survive the
      // merge — including logLevel, which is a sibling of colorize inside
      // logger.options.
      await cm.updateConfig({
        logger: { options: { colorize: false } },
      });

      cfg = cm.getConfig();
      expect(cfg.logger.enabled).toBe(true);
      expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.DEBUG);
      expect(cfg.logger.options.colorize).toBe(false);
    });
  });
});
