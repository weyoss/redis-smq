/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  ConfigurationMessageAuditExpireError,
  InvalidMessageAuditHistorySizeError,
  InvalidMessageAuditQueueSizeError,
} from '../../../src/errors/index.js';
import { parseMessageAuditConfig } from '../../../src/config-manager/parse-message-audit-config.js';

test('Configuration: message audit', async () => {
  expect(() => {
    parseMessageAuditConfig({
      acknowledgedMessages: {
        queueSize: -11,
      },
    });
  }).toThrow(InvalidMessageAuditQueueSizeError);

  expect(() => {
    parseMessageAuditConfig({
      acknowledgedMessages: {
        expire: -7,
      },
    });
  }).toThrow(ConfigurationMessageAuditExpireError);

  expect(() => {
    parseMessageAuditConfig({
      unacknowledgementHistory: {
        enabled: false,
        maxSize: -6,
      },
    });
  }).toThrow(InvalidMessageAuditHistorySizeError);

  const config = parseMessageAuditConfig({});
  expect(config.deadLetteredMessages.enabled).toEqual(false);
  expect(config.deadLetteredMessages.expire).toEqual(0);
  expect(config.deadLetteredMessages.queueSize).toEqual(0);
  expect(config.acknowledgedMessages.enabled).toEqual(false);
  expect(config.acknowledgedMessages.expire).toEqual(0);
  expect(config.acknowledgedMessages.queueSize).toEqual(0);
  expect(config.unacknowledgementHistory.enabled).toEqual(false);
  expect(config.unacknowledgementHistory.maxSize).toEqual(100);

  const config2 = parseMessageAuditConfig(false);
  expect(config2.deadLetteredMessages.enabled).toEqual(false);
  expect(config2.deadLetteredMessages.expire).toEqual(0);
  expect(config2.deadLetteredMessages.queueSize).toEqual(0);
  expect(config2.acknowledgedMessages.enabled).toEqual(false);
  expect(config2.acknowledgedMessages.expire).toEqual(0);
  expect(config2.acknowledgedMessages.queueSize).toEqual(0);
  expect(config2.unacknowledgementHistory.enabled).toEqual(false);
  expect(config2.unacknowledgementHistory.maxSize).toEqual(100);

  const config3 = parseMessageAuditConfig(true);
  expect(config3.deadLetteredMessages.enabled).toEqual(true);
  expect(config3.deadLetteredMessages.expire).toEqual(0);
  expect(config3.deadLetteredMessages.queueSize).toEqual(0);
  expect(config3.acknowledgedMessages.enabled).toEqual(true);
  expect(config3.acknowledgedMessages.expire).toEqual(0);
  expect(config3.acknowledgedMessages.queueSize).toEqual(0);
  expect(config3.unacknowledgementHistory.enabled).toEqual(true);
  expect(config3.unacknowledgementHistory.maxSize).toEqual(100);

  const config5 = parseMessageAuditConfig({
    acknowledgedMessages: false,
  });
  expect(config5.deadLetteredMessages.enabled).toEqual(false);
  expect(config5.deadLetteredMessages.expire).toEqual(0);
  expect(config5.deadLetteredMessages.queueSize).toEqual(0);
  expect(config5.acknowledgedMessages.enabled).toEqual(false);
  expect(config5.acknowledgedMessages.expire).toEqual(0);
  expect(config5.acknowledgedMessages.queueSize).toEqual(0);
  expect(config5.unacknowledgementHistory.enabled).toEqual(false);
  expect(config5.unacknowledgementHistory.maxSize).toEqual(100);

  const config6 = parseMessageAuditConfig({
    acknowledgedMessages: true,
  });
  expect(config6.deadLetteredMessages.enabled).toEqual(false);
  expect(config6.deadLetteredMessages.expire).toEqual(0);
  expect(config6.deadLetteredMessages.queueSize).toEqual(0);
  expect(config6.acknowledgedMessages.enabled).toEqual(true);
  expect(config6.acknowledgedMessages.expire).toEqual(0);
  expect(config6.acknowledgedMessages.queueSize).toEqual(0);
  expect(config6.unacknowledgementHistory.enabled).toEqual(false);
  expect(config6.unacknowledgementHistory.maxSize).toEqual(100);

  const config7 = parseMessageAuditConfig({
    acknowledgedMessages: true,
    deadLetteredMessages: false,
  });
  expect(config7.deadLetteredMessages.enabled).toEqual(false);
  expect(config7.deadLetteredMessages.expire).toEqual(0);
  expect(config7.deadLetteredMessages.queueSize).toEqual(0);
  expect(config7.acknowledgedMessages.enabled).toEqual(true);
  expect(config7.acknowledgedMessages.expire).toEqual(0);
  expect(config7.acknowledgedMessages.queueSize).toEqual(0);
  expect(config7.unacknowledgementHistory.enabled).toEqual(false);
  expect(config7.unacknowledgementHistory.maxSize).toEqual(100);

  const config8 = parseMessageAuditConfig({
    acknowledgedMessages: true,
    deadLetteredMessages: true,
  });
  expect(config8.deadLetteredMessages.enabled).toEqual(true);
  expect(config8.deadLetteredMessages.expire).toEqual(0);
  expect(config8.deadLetteredMessages.queueSize).toEqual(0);
  expect(config8.acknowledgedMessages.enabled).toEqual(true);
  expect(config8.acknowledgedMessages.expire).toEqual(0);
  expect(config8.acknowledgedMessages.queueSize).toEqual(0);
  expect(config8.unacknowledgementHistory.enabled).toEqual(false);
  expect(config8.unacknowledgementHistory.maxSize).toEqual(100);

  const config9 = parseMessageAuditConfig({
    acknowledgedMessages: {},
    deadLetteredMessages: true,
  });
  expect(config9.deadLetteredMessages.enabled).toEqual(true);
  expect(config9.deadLetteredMessages.expire).toEqual(0);
  expect(config9.deadLetteredMessages.queueSize).toEqual(0);
  expect(config9.acknowledgedMessages.enabled).toEqual(true);
  expect(config9.acknowledgedMessages.expire).toEqual(0);
  expect(config9.acknowledgedMessages.queueSize).toEqual(0);
  expect(config9.unacknowledgementHistory.enabled).toEqual(false);
  expect(config9.unacknowledgementHistory.maxSize).toEqual(100);

  const config10 = parseMessageAuditConfig({
    acknowledgedMessages: {
      expire: 90000,
    },
    deadLetteredMessages: true,
  });
  expect(config10.deadLetteredMessages.enabled).toEqual(true);
  expect(config10.deadLetteredMessages.expire).toEqual(0);
  expect(config10.deadLetteredMessages.queueSize).toEqual(0);
  expect(config10.acknowledgedMessages.enabled).toEqual(true);
  expect(config10.acknowledgedMessages.expire).toEqual(90000);
  expect(config10.acknowledgedMessages.queueSize).toEqual(0);
  expect(config10.unacknowledgementHistory.enabled).toEqual(false);
  expect(config10.unacknowledgementHistory.maxSize).toEqual(100);

  const config11 = parseMessageAuditConfig({
    acknowledgedMessages: {
      expire: 90000,
      queueSize: 10000,
    },
    deadLetteredMessages: {
      expire: 18000,
      queueSize: 20000,
    },
  });
  expect(config11.deadLetteredMessages.enabled).toEqual(true);
  expect(config11.deadLetteredMessages.expire).toEqual(18000);
  expect(config11.deadLetteredMessages.queueSize).toEqual(20000);
  expect(config11.acknowledgedMessages.enabled).toEqual(true);
  expect(config11.acknowledgedMessages.expire).toEqual(90000);
  expect(config11.acknowledgedMessages.queueSize).toEqual(10000);
  expect(config11.unacknowledgementHistory.enabled).toEqual(false);
  expect(config11.unacknowledgementHistory.maxSize).toEqual(100);

  const config12 = parseMessageAuditConfig({
    acknowledgedMessages: false,
    deadLetteredMessages: false,
    unacknowledgementHistory: true,
  });
  expect(config12.deadLetteredMessages.enabled).toEqual(false);
  expect(config12.deadLetteredMessages.expire).toEqual(0);
  expect(config12.deadLetteredMessages.queueSize).toEqual(0);
  expect(config12.acknowledgedMessages.enabled).toEqual(false);
  expect(config12.acknowledgedMessages.expire).toEqual(0);
  expect(config12.acknowledgedMessages.queueSize).toEqual(0);
  expect(config12.unacknowledgementHistory.enabled).toEqual(true);
  expect(config12.unacknowledgementHistory.maxSize).toEqual(100);

  const config13 = parseMessageAuditConfig({
    unacknowledgementHistory: {
      enabled: false,
    },
  });
  expect(config13.deadLetteredMessages.enabled).toEqual(false);
  expect(config13.deadLetteredMessages.expire).toEqual(0);
  expect(config13.deadLetteredMessages.queueSize).toEqual(0);
  expect(config13.acknowledgedMessages.enabled).toEqual(false);
  expect(config13.acknowledgedMessages.expire).toEqual(0);
  expect(config13.acknowledgedMessages.queueSize).toEqual(0);
  expect(config13.unacknowledgementHistory.enabled).toEqual(false);
  expect(config13.unacknowledgementHistory.maxSize).toEqual(100);

  const config14 = parseMessageAuditConfig({
    unacknowledgementHistory: {
      enabled: true,
    },
  });
  expect(config14.deadLetteredMessages.enabled).toEqual(false);
  expect(config14.deadLetteredMessages.expire).toEqual(0);
  expect(config14.deadLetteredMessages.queueSize).toEqual(0);
  expect(config14.acknowledgedMessages.enabled).toEqual(false);
  expect(config14.acknowledgedMessages.expire).toEqual(0);
  expect(config14.acknowledgedMessages.queueSize).toEqual(0);
  expect(config14.unacknowledgementHistory.enabled).toEqual(true);
  expect(config14.unacknowledgementHistory.maxSize).toEqual(100);

  const config15 = parseMessageAuditConfig({
    unacknowledgementHistory: {
      enabled: true,
      maxSize: 900,
    },
  });
  expect(config15.deadLetteredMessages.enabled).toEqual(false);
  expect(config15.deadLetteredMessages.expire).toEqual(0);
  expect(config15.deadLetteredMessages.queueSize).toEqual(0);
  expect(config15.acknowledgedMessages.enabled).toEqual(false);
  expect(config15.acknowledgedMessages.expire).toEqual(0);
  expect(config15.acknowledgedMessages.queueSize).toEqual(0);
  expect(config15.unacknowledgementHistory.enabled).toEqual(true);
  expect(config15.unacknowledgementHistory.maxSize).toEqual(900);

  const config16 = parseMessageAuditConfig({
    acknowledgedMessages: {
      expire: 90000,
      queueSize: 10000,
    },
    deadLetteredMessages: {
      expire: 18000,
      queueSize: 20000,
    },
    unacknowledgementHistory: {
      enabled: true,
      maxSize: 900,
    },
  });
  expect(config16.deadLetteredMessages.enabled).toEqual(true);
  expect(config16.deadLetteredMessages.expire).toEqual(18000);
  expect(config16.deadLetteredMessages.queueSize).toEqual(20000);
  expect(config16.acknowledgedMessages.enabled).toEqual(true);
  expect(config16.acknowledgedMessages.expire).toEqual(90000);
  expect(config16.acknowledgedMessages.queueSize).toEqual(10000);
  expect(config16.unacknowledgementHistory.enabled).toEqual(true);
  expect(config16.unacknowledgementHistory.maxSize).toEqual(900);
});
