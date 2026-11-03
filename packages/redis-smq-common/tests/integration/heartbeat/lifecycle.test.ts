/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import bluebird from 'bluebird';
import { getDummyLogger } from '../../../src/logger/index.js';
import { getRedisInstance } from '../../helpers/common.js';
import {
  asClient,
  mockRedisClient,
  TestableHeartbeat,
  waitFor,
} from './common.js';

// `Heartbeat` enforces a 3000ms minimum TTL → minimum interval of 1000ms.
const HEARTBEAT_TTL = 3000;
const HEARTBEAT_INTERVAL = 1000;
const KEY = 'test-heartbeat-key';

async function makeHeartbeat() {
  const client = await getRedisInstance();
  const heartbeat = bluebird.promisifyAll(
    new TestableHeartbeat(client, getDummyLogger(), {
      componentId: 'c1',
      componentType: 't1',
      heartbeatKey: KEY,
      heartbeatTTL: HEARTBEAT_TTL,
    }),
  );

  const events: string[] = [];
  heartbeat.on('heartbeat.goingUp', () => events.push('goingUp'));
  heartbeat.on('heartbeat.up', () => events.push('up'));
  heartbeat.on('heartbeat.goingDown', () => events.push('goingDown'));
  heartbeat.on('heartbeat.down', () => events.push('down'));

  return { heartbeat, events, client };
}

describe('Heartbeat: lifecycle', () => {
  describe('run / shutdown transitions', () => {
    it('run() emits goingUp then up', async () => {
      const { heartbeat, events } = await makeHeartbeat();
      await heartbeat.runAsync();
      expect(events).toEqual(['goingUp', 'up']);
      await heartbeat.shutdownAsync();
    });

    it('run() writes the heartbeat payload to Redis', async () => {
      const { heartbeat, client } = await makeHeartbeat();
      const before = Date.now();
      await heartbeat.runAsync();

      const raw = await client.getAsync(KEY);
      expect(raw).toBeTruthy();
      const payload = JSON.parse(raw as string);
      expect(payload.componentId).toBe('c1');
      expect(payload.componentType).toBe('t1');
      expect(payload.timestamp).toBeGreaterThanOrEqual(before);

      await heartbeat.shutdownAsync();
    });

    it('shutdown() emits goingDown then down', async () => {
      const { heartbeat, events } = await makeHeartbeat();
      await heartbeat.runAsync();
      events.length = 0;
      await heartbeat.shutdownAsync();
      expect(events).toEqual(['goingDown', 'down']);
    });

    it('shutdown() deletes the heartbeat key', async () => {
      const { heartbeat, client } = await makeHeartbeat();
      await heartbeat.runAsync();
      expect(await client.getAsync(KEY)).toBeTruthy();

      await heartbeat.shutdownAsync();
      expect(await client.getAsync(KEY)).toBeNull();
    });
  });

  describe('beat cycle', () => {
    it('emits heartbeat.beat with componentId, componentType, and timestamp', async () => {
      const { heartbeat } = await makeHeartbeat();
      const beats: Array<{ id: string; type: string; ts: number }> = [];
      heartbeat.on('heartbeat.beat', (id, type, ts) =>
        beats.push({ id, type, ts }),
      );

      await heartbeat.runAsync();
      // First `heartbeat.beat` fires after one interval — the initial beat
      // inside `goingUp()` writes the key but does not emit the event.
      await waitFor(() => beats.length >= 1, HEARTBEAT_INTERVAL * 2);

      expect(beats[0].id).toBe('c1');
      expect(beats[0].type).toBe('t1');
      expect(beats[0].ts).toBeGreaterThan(0);

      await heartbeat.shutdownAsync();
    });

    it('repeats at the configured interval and stops after shutdown', async () => {
      const { heartbeat } = await makeHeartbeat();
      const beats: number[] = [];
      heartbeat.on('heartbeat.beat', (_id, _type, ts) => beats.push(ts));

      await heartbeat.runAsync();
      await waitFor(() => beats.length >= 2, HEARTBEAT_INTERVAL * 3);

      const gap = beats[1] - beats[0];
      expect(gap).toBeGreaterThanOrEqual(HEARTBEAT_INTERVAL - 200);
      expect(gap).toBeLessThanOrEqual(HEARTBEAT_INTERVAL + 500);

      await heartbeat.shutdownAsync();
      const countAtShutdown = beats.length;

      await bluebird.delay(HEARTBEAT_INTERVAL * 1.5);
      expect(beats.length).toBe(countAtShutdown);
    });
  });

  describe('error handling', () => {
    it('rejects run() when the first beat fails, without emitting heartbeat.error', async () => {
      // Contract: `goingUp()` calls `beat()` directly and forwards the
      // error to the state machine. `handleError()` — the only place that
      // emits `heartbeat.error` — is NOT invoked on the first beat.
      const client = mockRedisClient({
        set: vi.fn((_k, _v, _o, cb) => cb(new Error('simulated set failure'))),
        del: vi.fn((_k, cb) => cb()),
      });

      const heartbeat = bluebird.promisifyAll(
        new TestableHeartbeat(asClient(client), getDummyLogger(), {
          componentId: 'c1',
          componentType: 't1',
          heartbeatKey: KEY,
          heartbeatTTL: HEARTBEAT_TTL,
        }),
      );

      const errors: Error[] = [];
      heartbeat.on('heartbeat.error', (e) => errors.push(e));
      const beatSpy = vi.fn();
      heartbeat.on('heartbeat.beat', beatSpy);

      await expect(heartbeat.runAsync()).rejects.toThrow(
        'simulated set failure',
      );
      expect(errors).toHaveLength(0);
      expect(beatSpy).not.toHaveBeenCalled();

      await Promise.race([
        heartbeat.shutdownAsync().catch(() => undefined),
        bluebird.delay(1000),
      ]);
    });

    it('emits heartbeat.error when a scheduled beat fails', async () => {
      // The only path that emits `heartbeat.error`: a scheduled beat
      // failing after backoff retries exhaust.
      const { heartbeat } = await makeHeartbeat();

      const errors: Error[] = [];
      heartbeat.on('heartbeat.error', (e) => errors.push(e));

      await heartbeat.runAsync();

      // Replace `execute` on the internal backoff so the next scheduled
      // beat fails immediately instead of retrying for seconds.
      // Parameter types are inferred from `backoff.execute` — no casts.
      const backoff = heartbeat.getBackoff();
      const originalExecute = backoff.execute;
      backoff.execute = (_task, callback) => {
        callback(new Error('scheduled beat failure'));
      };

      await waitFor(() => errors.length >= 1, HEARTBEAT_INTERVAL * 2);
      expect(errors[0].message).toBe('scheduled beat failure');

      backoff.execute = originalExecute;
      await Promise.race([
        heartbeat.shutdownAsync().catch(() => undefined),
        bluebird.delay(1000),
      ]);
    });
  });
});
