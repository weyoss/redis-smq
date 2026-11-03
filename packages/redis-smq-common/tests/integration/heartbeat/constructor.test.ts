/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { IHeartbeatConfig } from '../../../src/heartbeat/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { asClient, mockRedisClient, TestableHeartbeat } from './common.js';

function makeHeartbeat(overrides: Partial<IHeartbeatConfig> = {}) {
  return new TestableHeartbeat(asClient(mockRedisClient()), getDummyLogger(), {
    componentId: 'c1',
    componentType: 't1',
    heartbeatKey: 'hb',
    ...overrides,
  });
}

describe('Heartbeat: constructor', () => {
  it('accepts a fully-populated config', () => {
    expect(() => makeHeartbeat()).not.toThrow();
  });

  it('rejects when componentId is empty', () => {
    expect(() => makeHeartbeat({ componentId: '' })).toThrow(
      /componentId, componentType and heartbeatKey are required/,
    );
  });

  it('rejects when componentType is empty', () => {
    expect(() => makeHeartbeat({ componentType: '' })).toThrow(/required/);
  });

  it('rejects when heartbeatKey is empty', () => {
    expect(() => makeHeartbeat({ heartbeatKey: '' })).toThrow(/required/);
  });

  it('rejects heartbeatTTL below the 3000ms minimum', () => {
    expect(() => makeHeartbeat({ heartbeatTTL: 2000 })).toThrow(
      /heartbeatTTL must be not longer than 3000 milliseconds/,
    );
  });

  it('accepts heartbeatTTL at the 3000ms minimum', () => {
    expect(() => makeHeartbeat({ heartbeatTTL: 3000 })).not.toThrow();
  });

  it('uses the 60000ms default TTL and derives a 20000ms interval', () => {
    const hb = makeHeartbeat();
    expect(hb.getHeartbeatTTL()).toBe(60_000);
    expect(hb.getHeartbeatInterval()).toBe(20_000);
  });

  it('derives heartbeatInterval = TTL / 3', () => {
    const hb = makeHeartbeat({ heartbeatTTL: 9000 });
    expect(hb.getHeartbeatInterval()).toBe(3000);
  });
});
