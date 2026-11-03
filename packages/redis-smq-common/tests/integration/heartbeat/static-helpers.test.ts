/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import { Heartbeat } from '../../../src/heartbeat/index.js';
import { asClient, mockRedisClient, type MockRedisClient } from './common.js';

function isAlive(client: MockRedisClient, key: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    Heartbeat.isComponentAlive(asClient(client), key, (err, alive) =>
      err ? reject(err) : resolve(alive as boolean),
    );
  });
}

function areAlive(
  client: MockRedisClient,
  keys: string[],
): Promise<Record<string, boolean>> {
  return new Promise((resolve, reject) => {
    Heartbeat.areComponentsAlive(asClient(client), keys, (err, result) =>
      err ? reject(err) : resolve(result as Record<string, boolean>),
    );
  });
}

describe('Heartbeat.isComponentAlive', () => {
  it('resolves true when the heartbeat key exists', async () => {
    const client = mockRedisClient({
      get: vi.fn((_key, cb) => cb(null, '{"timestamp":123}')),
    });
    await expect(isAlive(client, 'hb')).resolves.toBe(true);
    expect(client.get).toHaveBeenCalledWith('hb', expect.any(Function));
  });

  it('resolves false when the heartbeat key is missing', async () => {
    const client = mockRedisClient({
      get: vi.fn((_key, cb) => cb(null, null)),
    });
    await expect(isAlive(client, 'hb')).resolves.toBe(false);
  });

  it('rejects when Redis GET fails', async () => {
    const client = mockRedisClient({
      get: vi.fn((_key, cb) => cb(new Error('redis error'))),
    });
    await expect(isAlive(client, 'hb')).rejects.toThrow('redis error');
  });
});

describe('Heartbeat.areComponentsAlive', () => {
  it('maps each key to true/false based on its presence', async () => {
    const client = mockRedisClient({
      mget: vi.fn((_keys, cb) => cb(null, ['v1', null, 'v3'])),
    });
    await expect(areAlive(client, ['a', 'b', 'c'])).resolves.toEqual({
      a: true,
      b: false,
      c: true,
    });
  });

  it('resolves with an empty object for an empty key list without calling MGET', async () => {
    const client = mockRedisClient();
    await expect(areAlive(client, [])).resolves.toEqual({});
    expect(client.mget).not.toHaveBeenCalled();
  });

  it('rejects when Redis MGET fails', async () => {
    const client = mockRedisClient({
      mget: vi.fn((_keys, cb) => cb(new Error('redis error'))),
    });
    await expect(areAlive(client, ['a'])).rejects.toThrow('redis error');
  });
});
