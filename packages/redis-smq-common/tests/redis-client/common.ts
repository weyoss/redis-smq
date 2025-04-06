/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { env } from '../../src/env/index.js';
import { IRedisConfig } from '../../src/redis-client/index.js';
import { getRedisInstance } from '../common.js';

export async function standardCommands(config: IRedisConfig) {
  const client = await getRedisInstance(config);

  let r: unknown = await client.setAsync('key1', 'value', {});
  expect(r).toBe('OK');

  r = await client.getAsync('key1');
  expect(r).toBe('value');

  r = await client.delAsync('key1');
  expect(r).toBe(1);

  r = await client.setAsync('key2', 'value', {
    expire: { mode: 'PX', value: 10000 },
  });
  expect(r).toBe('OK');

  r = await client.setAsync('key3', 'value', {
    expire: { mode: 'PX', value: 10000 },
    exists: 'NX',
  });
  expect(r).toBe('OK');

  r = await client.zaddAsync('key4', 100, 'value');
  expect(r).toBe(1);

  r = await client.zaddAsync('key4', 200, 'value2');
  expect(r).toBe(1);

  r = await client.zcardAsync('key4');
  expect(r).toBe(2);

  r = await client.zrangeAsync('key4', 0, 200);
  expect(r).toEqual(['value', 'value2']);

  r = await client.zscanAsync('key4', '0', {});
  expect(r).toEqual({ cursor: '0', items: ['value', 'value2'] });

  r = await client.zrevrangeAsync('key4', 0, 200);
  expect(r).toEqual(['value2', 'value']);

  r = await client.zrangebyscoreAsync('key4', 0, 200, 0, 100);
  expect(r).toEqual(['value', 'value2']);

  r = await client.zrangebyscorewithscoresAsync('key4', 0, 200);
  expect(r).toEqual({ 100: 'value', 200: 'value2' });

  r = await client.zremrangebyscoreAsync('key4', 0, 200);
  expect(r).toEqual(2);

  r = await client.saddAsync('key5', 'value');
  expect(r).toBe(1);

  r = await client.sismemberAsync('key5', 'value');
  expect(r).toEqual(1);

  r = await client.smembersAsync('key5');
  expect(r).toEqual(['value']);

  for (let i = 0; i < 1100; i += 1) {
    r = await client.hsetAsync('key6', `k${i}`, `v${i}`);
    expect(r).toBe(1);
  }

  r = await client.hgetAsync('key6', 'k1');
  expect(r).toBe('v1');

  r = await client.hmgetAsync('key6', ['k2', 'k300']);
  expect(r).toEqual(['v2', 'v300']);

  r = await client.hgetallAsync('key6');
  expect(Object.keys(r && typeof r === 'object' ? r : {}).length).toEqual(1100);

  r = await client.hscanAllAsync('key6', {});
  expect(Object.keys(r && typeof r === 'object' ? r : {}).length).toEqual(1100);

  if (client.validateRedisVersion(2, 8)) {
    r = await client.hscanAllAsync('key6', {});
    expect(Object.keys(r && typeof r === 'object' ? r : {}).length).toEqual(
      1100,
    );
  }

  r = await client.hkeysAsync('key6');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(r.length).toEqual(1100);

  r = await client.hlenAsync('key6');
  expect(r).toEqual(1100);

  r = await client.hdelAsync('key6', 'k1');
  expect(r).toEqual(1);

  r = await client.hgetallAsync('key6');
  expect(Object.keys(r && typeof r === 'object' ? r : {}).length).toEqual(1099);

  r = await client.hdelAsync('key6', 'k1');
  expect(r).toEqual(0);

  for (let i = 0; i < 1100; i += 1) {
    await client.hdelAsync('key6', `k${i}`);
  }

  r = await client.hgetallAsync('key6');
  expect(r).toEqual({});

  if (client.validateRedisVersion(2, 8)) {
    r = await client.hscanAllAsync('key6', {});
    expect(r).toEqual({});
  }

  r = await client.llenAsync('key7');
  expect(r).toEqual(0);

  r = await client.lrangeAsync('key7', 0, 100);
  expect(r).toEqual([]);

  r = await client.brpoplpushAsync('key7', 'key8', 1);
  expect(r).toEqual(null);

  r = await client.rpoplpushAsync('key7', 'key8');
  expect(r).toEqual(null);

  r = await client.rpopAsync('key7');
  expect(r).toEqual(null);

  r = await client.lpoprpushAsync('key7', 'key8');
  expect(r).toEqual(null);

  r = await client.lremAsync('key7', 1, 'value');
  expect(r).toEqual(0);

  r = await client.watchAsync(['key7']);
  expect(r).toEqual('OK');

  r = await client.zpoprpushAsync('key9', 'key11');
  expect(r).toEqual(null);

  r = await client.zremAsync('key14', 'key15');
  expect(r).toEqual(0);

  r = await client.unwatchAsync();
  expect(r).toEqual('OK');

  r = await client.getInfoAsync();
  expect(typeof r).toBe('string');

  r = await client.flushallAsync();
  expect(typeof r).toBe('string');

  const members: number[] = [];
  for (let i = 0; i < 1000; i += 1) {
    await client.saddAsync('key14', `${i}`);
    members.push(i);
  }
  const m = await client.sscanAllAsync('key14', {});
  expect(m.map((i) => Number(i)).sort((a, b) => a - b)).toEqual(members);

  r = await client.sremAsync('key14', '0');
  expect(r).toEqual(1);

  if (client.validateRedisVersion(2, 8)) {
    const m2 = await client.sscanAllAsync('key14', { MATCH: '9*', COUNT: 10 });
    expect(m2.map((i) => Number(i)).sort((a, b) => a - b)).toEqual(
      members.filter((i) => String(i).indexOf('9') === 0).sort((a, b) => a - b),
    );
  }

  await client.shutdownAsync(); // does exec quit command
  await client.shutdownAsync(); // does not exec quit
}

export async function scriptRunning(config: IRedisConfig) {
  const dir = env.getCurrentDir();
  const client = await getRedisInstance(config);
  await client.loadScriptFilesAsync({
    test_script: resolve(dir, './lua-scripts/test_script.lua'),
  });
  const r = await client.runScriptAsync('test_script', [], []);
  expect(r).toBe(1);
}

export async function pubSubPattern(config: IRedisConfig) {
  const subscribeClient = await getRedisInstance(config);
  const publishClient = await getRedisInstance(config);

  let received: { pattern: string; channel: string; message: string } | null =
    null;
  subscribeClient.psubscribe('chan*');
  subscribeClient.on(
    'pmessage',
    (pattern: string, channel: string, message: string) => {
      received = { pattern, channel, message };
    },
  );
  await bluebird.delay(5000);
  const r = await publishClient.publishAsync('chan1', 'msg1');
  expect(r).toBe(1);

  // eslint-disable-next-line no-constant-condition
  for (; true; ) {
    if (received) break;
    await bluebird.delay(1000);
  }
  expect(received).toEqual({
    pattern: 'chan*',
    channel: 'chan1',
    message: 'msg1',
  });
  subscribeClient.punsubscribe('chan*');
}

export async function pubSubChannel(config: IRedisConfig) {
  const subscribeClient = await getRedisInstance(config);
  const publishClient = await getRedisInstance(config);

  let received: { channel: string; message: string } | null = null;
  subscribeClient.subscribe('chan1');
  subscribeClient.on('message', (channel: string, message: string) => {
    received = { channel, message };
  });
  await bluebird.delay(5000);
  const r = await publishClient.publishAsync('chan1', 'msg1');
  expect(r).toBe(1);

  // eslint-disable-next-line no-constant-condition
  for (; true; ) {
    if (received) break;
    await bluebird.delay(1000);
  }
  expect(received).toEqual({
    channel: 'chan1',
    message: 'msg1',
  });
  subscribeClient.unsubscribe('chan1');
}

export async function transactionRunning(config: IRedisConfig) {
  const client = await getRedisInstance(config);
  const multi = bluebird.promisifyAll(client.multi());
  multi.del('k1');
  multi.hdel('k2', 'f1');
  multi.hset('k3', 'f1', 'v1');
  multi.sadd('k4', 'v1');
  multi.hset('k5', 'f1', 'v1');
  multi.rpoplpush('k6', 'k7');
  multi.pexpire('k8', 5000);
  multi.srem('k9', 'v1');
  multi.zrem('k10', 'v1');
  multi.zadd('k11', 1, 'v1');
  multi.rpush('k12', 'v1');
  multi.rpop('k13');
  multi.lpush('k14', 'v1');
  multi.lpop('k15');
  multi.lrem('k16', 1, 'v1');
  multi.ltrim('k17', 0, 10);
  multi.expire('k18', 3);
  multi.hincrby('k19', 'f1', 10);
  const r = await multi.execAsync();
  expect(Array.isArray(r)).toBe(true);
  expect((r ?? []).length).toEqual(18);
}
