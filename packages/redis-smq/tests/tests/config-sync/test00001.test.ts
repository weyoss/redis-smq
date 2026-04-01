/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { Configuration } from '../../../src/config-manager/configuration.js';
import { fork } from 'child_process';
import path from 'path';
import { env } from 'redis-smq-common';
import { config } from '../../common/config.js';
import { ConfigManager } from '../../../src/index.js';

test('ConfigSync', async () => {
  const configManager = new ConfigManager();
  await configManager.updateConfig({
    messageAudit: false,
  });

  const c0 = Configuration.getConfig();
  expect(c0.messageAudit.acknowledgedMessages.enabled).toBe(false);
  expect(c0.messageAudit.deadLetteredMessages.enabled).toBe(false);
  expect(c0.messageAudit.unacknowledgementHistory.enabled).toBe(false);

  await new Promise((resolve) => {
    const thread = fork(
      path.join(env.getCurrentDir(), 'update-config-thread.js'),
    );
    thread.send(JSON.stringify({ config }));
    thread.on('error', () => void 0);
    thread.on('exit', resolve);
  });

  const c1 = Configuration.getConfig();
  expect(c1.messageAudit.acknowledgedMessages.enabled).toBe(true);
  expect(c1.messageAudit.deadLetteredMessages.enabled).toBe(true);
  expect(c1.messageAudit.unacknowledgementHistory.enabled).toBe(true);
});
