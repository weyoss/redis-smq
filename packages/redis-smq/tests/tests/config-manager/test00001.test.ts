/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { RedisSMQ } from '../../../src/index.js';
import { EConsoleLoggerLevel } from 'redis-smq-common';

describe('ConfigManager.updateConfig - nested merge', () => {
  it('preserves previously-set messageAudit sub-keys', async () => {
    const cm = RedisSMQ.createConfigManager();

    await cm.updateConfig({
      messageAudit: {
        acknowledgedMessages: { enabled: true, queueSize: 5000, expire: 3600 },
      },
    });

    let cfg = cm.getConfig();
    expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
    expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(5000);

    await cm.updateConfig({
      messageAudit: { deadLetteredMessages: true },
    });

    cfg = cm.getConfig();
    // The previously-set acknowledgedMessages config must survive
    expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(true);
    expect(cfg.messageAudit.acknowledgedMessages.queueSize).toBe(5000);
    expect(cfg.messageAudit.acknowledgedMessages.expire).toBe(3600);
    // And the new update must be applied
    expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(true);
  });

  it('replaces the whole messageAudit section when a boolean is passed', async () => {
    const cm = RedisSMQ.createConfigManager();

    await cm.updateConfig({
      messageAudit: { acknowledgedMessages: true },
    });
    expect(cm.getConfig().messageAudit.acknowledgedMessages.enabled).toBe(true);

    // Passing a boolean must override, not merge
    await cm.updateConfig({ messageAudit: false });
    const cfg = cm.getConfig();
    expect(cfg.messageAudit.acknowledgedMessages.enabled).toBe(false);
    expect(cfg.messageAudit.deadLetteredMessages.enabled).toBe(false);
    expect(cfg.messageAudit.unacknowledgementHistory.enabled).toBe(false);
  });

  it('preserves previously-set logger sub-keys', async () => {
    const cm = RedisSMQ.createConfigManager();

    await cm.updateConfig({
      logger: {
        enabled: true,
        options: { logLevel: EConsoleLoggerLevel.DEBUG },
      },
    });

    let cfg = cm.getConfig();
    expect(cfg.logger.enabled).toBe(true);
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.DEBUG);

    await cm.updateConfig({
      logger: { options: { colorize: false } },
    });

    cfg = cm.getConfig();
    expect(cfg.logger.enabled).toBe(true); // preserved
    expect(cfg.logger.options.logLevel).toBe(EConsoleLoggerLevel.DEBUG); // preserved
    expect(cfg.logger.options.colorize).toBe(false); // applied
  });
});
