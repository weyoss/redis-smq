/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { RedisSMQ } from '../../../src/index.js';
import { syncConfigFromChild } from '../../helpers/scenarios/config-sync.js';

/**
 * Integration test for cross-process config propagation.
 *
 * RedisSMQ's configuration is stored in Redis, not in the
 * process's memory. When one process writes a config change via
 * `ConfigManager.updateConfig`, every other process connected to the
 * same Redis sees the new value on its next read. This test verifies
 * that property end-to-end:
 *
 *   1. The parent sets `messageAudit: false` via its own
 *      `ConfigManager`.
 *   2. The parent forks a child that sets `messageAudit: true` via
 *      its own `ConfigManager` and exits.
 *   3. The parent re-reads its config and observes `true`.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConfigManager — cross-process sync', () => {
  it('observes a config change written by a child process', async () => {
    const parentManager = RedisSMQ.createConfigManager();
    await parentManager.updateConfig({ messageAudit: false });

    // Sanity: the parent's own read sees the write. If this fails,
    // the test would not be able to distinguish "the cross-process
    // propagation is broken" from "the parent's write never landed".
    expect(
      parentManager.getConfig().messageAudit.acknowledgedMessages.enabled,
    ).toBe(false);

    // Fork the child and let it write `messageAudit: true`. The
    // helper (`syncConfigFromChild`) resolves when the child has
    // exited cleanly — by that point, the child's `updateConfig`
    // write is durable in Redis, and the parent's next read should
    // observe it.
    //
    // The helper also handles the fork plumbing: stderr capture,
    // timeout, and the exit-code check. A child that fails to
    // initialize, fails to update the config, or exits non-zero
    // causes the helper to reject with a specific message rather
    // than the parent's test hanging or passing silently.
    await syncConfigFromChild({ patch: { messageAudit: true } });

    // The load-bearing assertion: the parent's read reflects the
    // child's write.
    //
    // The parent's `ConfigManager` is a distinct instance from the
    // one the child created. The two share Redis but not memory, so
    // the observation can only be explained by the child's write
    // reaching the shared store and the parent's read pulling it
    // back. A regression where `updateConfig` wrote to a
    // process-local cache would leave the parent's read at the value
    // it wrote in the pre-state phase — `false` — and this assertion
    // would fail with the actual value named.
    const observed = parentManager.getConfig().messageAudit;
    expect(
      observed.acknowledgedMessages.enabled,
      'the acknowledged-messages flag should reflect the child\u2019s write',
    ).toBe(true);
    expect(
      observed.deadLetteredMessages.enabled,
      'the dead-lettered-messages flag should reflect the child\u2019s write',
    ).toBe(true);
    expect(
      observed.unacknowledgementHistory.enabled,
      'the unacknowledgement-history flag should reflect the child\u2019s write',
    ).toBe(true);
  });
});
