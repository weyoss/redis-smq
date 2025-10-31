/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import {
  ConfigurationMessageAuditQueueSizeError,
  ConfigurationMessageAuditExpireError,
} from '../../../src/errors/index.js';
import { parseMessageAuditConfig } from '../../../src/config/parse-message-audit-config.js';

test('Configuration: storeMessages', async () => {
  expect(() => {
    parseMessageAuditConfig({
      acknowledgedMessages: {
        queueSize: -11,
      },
    });
  }).toThrow(ConfigurationMessageAuditQueueSizeError);

  expect(() => {
    parseMessageAuditConfig({
      acknowledgedMessages: {
        expire: -7,
      },
    });
  }).toThrow(ConfigurationMessageAuditExpireError);

  const config = parseMessageAuditConfig({});
  expect(config.deadLetteredMessages.enabled).toEqual(false);
  expect(config.deadLetteredMessages.expire).toEqual(0);
  expect(config.deadLetteredMessages.queueSize).toEqual(0);
  expect(config.acknowledgedMessages.enabled).toEqual(false);
  expect(config.acknowledgedMessages.expire).toEqual(0);
  expect(config.acknowledgedMessages.queueSize).toEqual(0);

  const config2 = parseMessageAuditConfig(false);
  expect(config2.deadLetteredMessages.enabled).toEqual(false);
  expect(config2.deadLetteredMessages.expire).toEqual(0);
  expect(config2.deadLetteredMessages.queueSize).toEqual(0);
  expect(config2.acknowledgedMessages.enabled).toEqual(false);
  expect(config2.acknowledgedMessages.expire).toEqual(0);
  expect(config2.acknowledgedMessages.queueSize).toEqual(0);

  const config3 = parseMessageAuditConfig(true);
  expect(config3.deadLetteredMessages.enabled).toEqual(true);
  expect(config3.deadLetteredMessages.expire).toEqual(0);
  expect(config3.deadLetteredMessages.queueSize).toEqual(0);
  expect(config3.acknowledgedMessages.enabled).toEqual(true);
  expect(config3.acknowledgedMessages.expire).toEqual(0);
  expect(config3.acknowledgedMessages.queueSize).toEqual(0);

  const config4 = parseMessageAuditConfig({});
  expect(config4.deadLetteredMessages.enabled).toEqual(false);
  expect(config4.deadLetteredMessages.expire).toEqual(0);
  expect(config4.deadLetteredMessages.queueSize).toEqual(0);
  expect(config4.acknowledgedMessages.enabled).toEqual(false);
  expect(config4.acknowledgedMessages.expire).toEqual(0);
  expect(config4.acknowledgedMessages.queueSize).toEqual(0);

  const config5 = parseMessageAuditConfig({
    acknowledgedMessages: false,
  });
  expect(config5.deadLetteredMessages.enabled).toEqual(false);
  expect(config5.deadLetteredMessages.expire).toEqual(0);
  expect(config5.deadLetteredMessages.queueSize).toEqual(0);
  expect(config5.acknowledgedMessages.enabled).toEqual(false);
  expect(config5.acknowledgedMessages.expire).toEqual(0);
  expect(config5.acknowledgedMessages.queueSize).toEqual(0);

  const config6 = parseMessageAuditConfig({
    acknowledgedMessages: true,
  });
  expect(config6.deadLetteredMessages.enabled).toEqual(false);
  expect(config6.deadLetteredMessages.expire).toEqual(0);
  expect(config6.deadLetteredMessages.queueSize).toEqual(0);
  expect(config6.acknowledgedMessages.enabled).toEqual(true);
  expect(config6.acknowledgedMessages.expire).toEqual(0);
  expect(config6.acknowledgedMessages.queueSize).toEqual(0);

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
});
