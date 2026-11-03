/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { env } from '../../../src/env/index.js';
import {
  ERedisConfigClient,
  type IRedisConfig,
} from '../../../src/redis-client/index.js';
import { redisConfig } from '../../helpers/config.js';
import { getRedisInstance } from '../../helpers/common.js';

/**
 * Build a driver-specific Redis config that reflects the CURRENT
 * `redisConfig` — i.e. after `initializeRedis()` has assigned the
 * ephemeral port in `beforeAll`.
 *
 * MUST be called lazily (inside `it`, or from an arrow that is invoked
 * inside `it`). Capturing `redisConfig.options` at module load reads the
 * pre-`beforeAll` value (`port: 0`) and every connection will
 * ECONNREFUSED.
 */
export function driverConfig(client: ERedisConfigClient): IRedisConfig {
  if (client === ERedisConfigClient.REDIS) {
    return {
      client,
      options: {
        socket: {
          host: redisConfig.options?.host ?? '127.0.0.1',
          port: redisConfig.options?.port ?? 0,
        },
      },
    };
  }
  return { ...redisConfig, client };
}

/**
 * Smoke-test the full Redis client surface (string / hash / set / zset /
 * list / numeric / scan / transaction commands) against one driver.
 *
 * Every assertion here has burned a real regression at least once — do
 * not delete or weaken without replacing.
 */
export async function standardCommands(config: IRedisConfig) {
  const client = await getRedisInstance(config);

  // ping / exists
  await expect(client.pingAsync()).resolves.toBe('PONG');
  await expect(client.existsAsync('key1')).resolves.toBe(false);

  // set / get / del
  await client.setAsync('key1', 'value', {});
  await expect(client.existsAsync('key1')).resolves.toBe(true);
  await expect(client.getAsync('key1')).resolves.toBe('value');
  await expect(client.delAsync('key1')).resolves.toBe(1);

  // mget
  await client.setAsync('keyA', 'valueA', {});
  await client.setAsync('keyB', 'valueB', {});
  await expect(client.mgetAsync(['keyA', 'keyB', 'keyC'])).resolves.toEqual([
    'valueA',
    'valueB',
    null,
  ]);

  // set with PX / NX
  await client.setAsync('key2', 'value', {
    expire: { mode: 'PX', value: 10_000 },
  });
  await client.setAsync('key3', 'value', {
    expire: { mode: 'PX', value: 10_000 },
    exists: 'NX',
  });

  // expire / pexpire / ttl / pttl
  await client.expireAsync('keyA', 20);
  const ttl = await client.ttlAsync('keyA');
  expect(ttl).toBeGreaterThan(0);
  expect(ttl).toBeLessThanOrEqual(20);

  await client.pexpireAsync('keyB', 20_000);
  const pttl = await client.pttlAsync('keyB');
  expect(pttl).toBeGreaterThan(0);
  expect(pttl).toBeLessThanOrEqual(20_000);

  // zset
  await client.zaddAsync('zset1', 100, 'zvalue1');
  await client.zaddAsync('zset1', 200, 'zvalue2');
  await client.zaddAsync('zset1', 300, 'zvalue3');
  await client.zaddAsync('zset1', 400, 'zvalue4');
  await expect(client.zcardAsync('zset1')).resolves.toBe(4);
  await expect(client.zscoreAsync('zset1', 'zvalue2')).resolves.toBe('200');
  await expect(
    client.zscoreAsync('zset1', 'zvalue_invalid'),
  ).resolves.toBeNull();
  await expect(client.zrangeAsync('zset1', 0, 3)).resolves.toEqual([
    'zvalue1',
    'zvalue2',
    'zvalue3',
    'zvalue4',
  ]);

  const zscan = await client.zscanAsync('zset1', '0', {});
  expect(zscan.items).toBeDefined();
  expect(zscan.cursor).toBeDefined();

  await expect(client.zrevrangeAsync('zset1', 0, 3)).resolves.toEqual([
    'zvalue4',
    'zvalue3',
    'zvalue2',
    'zvalue1',
  ]);
  await expect(
    client.zrangebyscoreAsync('zset1', 100, 200, 0, 10),
  ).resolves.toEqual(['zvalue1', 'zvalue2']);
  await expect(
    client.zrangebyscorewithscoresAsync('zset1', '-inf', '+inf'),
  ).resolves.toEqual({
    100: 'zvalue1',
    200: 'zvalue2',
    300: 'zvalue3',
    400: 'zvalue4',
  });
  await expect(client.zcountAsync('zset1', 100, 200)).resolves.toBe(2);

  await expect(client.zremAsync('zset1', 'zvalue2')).resolves.toBe(1);
  await expect(client.zcardAsync('zset1')).resolves.toBe(3);

  await expect(client.zpoprpushAsync('zset1', 'list0')).resolves.toBe(
    'zvalue1',
  );
  await expect(client.zcardAsync('zset1')).resolves.toBe(2);
  await expect(client.llenAsync('list0')).resolves.toBe(1);

  await expect(client.zpoplpushAsync('zset1', 'list0')).resolves.toBe(
    'zvalue3',
  );
  await expect(client.zcardAsync('zset1')).resolves.toBe(1);
  await expect(client.llenAsync('list0')).resolves.toBe(2);

  await expect(client.zremrangebyscoreAsync('zset1', 0, 400)).resolves.toBe(1);

  // set
  await client.saddAsync('set1', 'svalue1');
  await client.saddAsync('set1', 'svalue2');
  await expect(client.sismemberAsync('set1', 'svalue1')).resolves.toBe(1);
  const smembers = await client.smembersAsync('set1');
  expect([...smembers].sort()).toEqual(['svalue1', 'svalue2']);
  await expect(client.scardAsync('set1')).resolves.toBe(2);

  const sscan = await client.sscanAsync('set1', '0', { COUNT: 2 });
  expect(sscan.items).toBeDefined();
  expect(sscan.cursor).toBeDefined();

  // hash
  await client.hsetAsync('hset1', 'f1', 'v1');
  await client.hsetAsync('hset1', 'f2', 'v2');
  await expect(client.hgetAsync('hset1', 'f1')).resolves.toBe('v1');
  await expect(client.hmgetAsync('hset1', ['f1', 'f2'])).resolves.toEqual([
    'v1',
    'v2',
  ]);
  await expect(client.hgetallAsync('hset1')).resolves.toEqual({
    f1: 'v1',
    f2: 'v2',
  });
  const hkeys = await client.hkeysAsync('hset1');
  expect([...hkeys].sort()).toEqual(['f1', 'f2']);
  await expect(client.hlenAsync('hset1')).resolves.toBe(2);

  const hscan = await client.hscanAsync('hset1', '0', { COUNT: 2 });
  expect(hscan.result).toBeDefined();
  expect(hscan.cursor).toBeDefined();

  await expect(client.hdelAsync('hset1', 'f1')).resolves.toBe(1);

  // numeric
  await client.setAsync('numKey', '10', {});
  await expect(client.incrAsync('numKey')).resolves.toBe(11);
  await expect(client.incrbyAsync('numKey', 9)).resolves.toBe(20);
  await expect(client.decrAsync('numKey')).resolves.toBe(19);
  await expect(client.decrbyAsync('numKey', 9)).resolves.toBe(10);

  // list
  await expect(client.llenAsync('list1')).resolves.toBe(0);
  await expect(client.lrangeAsync('list1', 0, 100)).resolves.toEqual([]);
  await expect(client.brpoplpushAsync('list1', 'list2', 1)).resolves.toBeNull();

  await client.rpushAsync('list1', ['a', 'b', 'c']);
  await expect(client.llenAsync('list1')).resolves.toBe(3);
  await expect(client.lindexAsync('list1', 0)).resolves.toBe('a');
  await expect(client.lpopAsync('list1')).resolves.toBe('a');
  await expect(client.llenAsync('list1')).resolves.toBe(2);

  await client.lpushAsync('list1', 'd');
  await expect(client.lrangeAsync('list1', 0, -1)).resolves.toEqual([
    'd',
    'b',
    'c',
  ]);
  await expect(client.rpopAsync('list1')).resolves.toBe('c');
  await expect(client.llenAsync('list1')).resolves.toBe(2);

  await expect(client.rpoplpushAsync('list1', 'list2')).resolves.toBe('b');
  await expect(client.lrangeAsync('list1', 0, -1)).resolves.toEqual(['d']);
  await expect(client.lrangeAsync('list2', 0, -1)).resolves.toEqual(['b']);

  await expect(client.lpoprpushAsync('list1', 'list2')).resolves.toBe('d');
  await expect(client.llenAsync('list1')).resolves.toBe(0);
  await expect(client.lrangeAsync('list2', 0, -1)).resolves.toEqual(['b', 'd']);

  await client.rpushAsync('list3', ['x', 'y', 'x', 'z']);
  await expect(client.lremAsync('list3', 2, 'x')).resolves.toBe(2);
  await expect(client.lrangeAsync('list3', 0, -1)).resolves.toEqual(['y', 'z']);
  await expect(client.ltrimAsync('list3', 1, 1)).resolves.toBe('OK');
  await expect(client.lrangeAsync('list3', 0, -1)).resolves.toEqual(['z']);

  // lmove (Redis 6.2+)
  if (client.validateRedisVersion(6, 2)) {
    await client.rpushAsync('lmove_src', ['a', 'b', 'c']);
    await expect(
      client.lmoveAsync('lmove_src', 'lmove_dest', 'LEFT', 'RIGHT'),
    ).resolves.toBe('a');
    await expect(client.lrangeAsync('lmove_src', 0, -1)).resolves.toEqual([
      'b',
      'c',
    ]);
    await expect(client.lrangeAsync('lmove_dest', 0, -1)).resolves.toEqual([
      'a',
    ]);

    await expect(
      client.lmoveAsync('lmove_src', 'lmove_dest', 'RIGHT', 'LEFT'),
    ).resolves.toBe('c');
    await expect(client.lrangeAsync('lmove_src', 0, -1)).resolves.toEqual([
      'b',
    ]);
    await expect(client.lrangeAsync('lmove_dest', 0, -1)).resolves.toEqual([
      'c',
      'a',
    ]);
  }

  // watch / unwatch
  await client.watchAsync(['key7']);
  await client.unwatchAsync();

  // info
  const info = await client.getInfoAsync();
  expect(typeof info).toBe('string');

  // sscanAll
  const expectedMembers: number[] = [];
  for (let i = 0; i < 1000; i += 1) {
    await client.saddAsync('set2', `${i}`);
    expectedMembers.push(i);
  }
  const scanned = await client.sscanAllAsync('set2', {});
  expect(scanned.map(Number).sort((a, b) => a - b)).toEqual(expectedMembers);

  await client.sremAsync('set2', '0');

  // sscanAll with MATCH (Redis 2.8+)
  if (client.validateRedisVersion(2, 8)) {
    const matched = await client.sscanAllAsync('set2', {
      MATCH: '9*',
      COUNT: 10,
    });
    const expected = expectedMembers
      .filter((i) => i !== 0 && String(i).startsWith('9'))
      .sort((a, b) => a - b);
    expect(matched.map(Number).sort((a, b) => a - b)).toEqual(expected);
  }

  // hscanAll
  for (let i = 0; i < 1100; i += 1) {
    await client.hsetAsync('hset2', `k${i}`, `v${i}`);
  }
  const hscanAll = await client.hscanAllAsync('hset2', {});
  expect(Object.keys(hscanAll ?? {})).toHaveLength(1100);

  // shutdown / halt idempotency
  await client.flushallAsync();
  await client.shutdownAsync(); // issues QUIT
  await client.shutdownAsync(); // QUIT already sent — must not throw
  await client.haltAsync(); // halt is idempotent
}

/**
 * Load a Lua script file and run it once.
 */
export async function scriptRunning(config: IRedisConfig) {
  const client = await getRedisInstance(config);
  await client.loadScriptFilesAsync({
    test_script: resolve(env.getCurrentDir(), './lua-scripts/test_script.lua'),
  });
  await expect(client.runScriptAsync('test_script', [], [])).resolves.toBe(1);
  await client.shutdownAsync();
}

/**
 * Wait for a single pub/sub message. Subscribes on `subscribeClient`,
 * publishes on `publishClient`, and resolves with the received payload.
 */
async function waitForMessage<TPayload>(
  subscribeClient: Awaited<ReturnType<typeof getRedisInstance>>,
  publishClient: Awaited<ReturnType<typeof getRedisInstance>>,
  setup: { subscribe: () => void; publish: () => Promise<unknown> },
  receive: (cb: (payload: TPayload) => void) => void,
): Promise<TPayload> {
  const received = new Promise<TPayload>((resolve, reject) => {
    receive(resolve);
    setTimeout(
      () => reject(new Error('pub/sub message not received in time')),
      5_000,
    );
  });

  setup.subscribe();
  await bluebird.delay(100); // let the subscription land
  await setup.publish();

  return received;
}

export async function pubSubPattern(config: IRedisConfig) {
  const subscribeClient = await getRedisInstance(config);
  const publishClient = await getRedisInstance(config);

  const payload = await waitForMessage<{
    pattern: string;
    channel: string;
    message: string;
  }>(
    subscribeClient,
    publishClient,
    {
      subscribe: () => subscribeClient.psubscribe('chan*'),
      publish: () => publishClient.publishAsync('chan1', 'msg1'),
    },
    (resolve) => {
      subscribeClient.on(
        'pmessage',
        (pattern: string, channel: string, message: string) => {
          resolve({ pattern, channel, message });
        },
      );
    },
  );

  expect(payload).toEqual({
    pattern: 'chan*',
    channel: 'chan1',
    message: 'msg1',
  });

  subscribeClient.punsubscribe('chan*');
  await subscribeClient.shutdownAsync();
  await publishClient.shutdownAsync();
}

export async function pubSubChannel(config: IRedisConfig) {
  const subscribeClient = await getRedisInstance(config);
  const publishClient = await getRedisInstance(config);

  const payload = await waitForMessage<{ channel: string; message: string }>(
    subscribeClient,
    publishClient,
    {
      subscribe: () => subscribeClient.subscribe('chan1'),
      publish: () => publishClient.publishAsync('chan1', 'msg1'),
    },
    (resolve) => {
      subscribeClient.on('message', (channel: string, message: string) => {
        resolve({ channel, message });
      });
    },
  );

  expect(payload).toEqual({ channel: 'chan1', message: 'msg1' });

  subscribeClient.unsubscribe('chan1');
  await subscribeClient.shutdownAsync();
  await publishClient.shutdownAsync();
}

/**
 * Exercise MULTI/EXEC with every command type in one transaction.
 * The reply array is positional — keep it in sync with the queued commands.
 */
export async function transactionRunning(config: IRedisConfig) {
  const client = await getRedisInstance(config);

  // ---- Setup (seeds data the transaction will read/modify) ----
  await client.setAsync('trx_k_get', 'v1', {});
  await client.hsetAsync('trx_h_hget', 'f1', 'v1');
  await client.saddAsync('trx_s_smembers', 's1');
  await client.zaddAsync('trx_z_zcard', 1, 'z1');
  await client.rpushAsync('trx_l_llen', 'l1');
  await client.setAsync('trx_num_incr', '100', {});
  await client.hsetAsync('trx_h_hincrby', 'f1', '10');
  await client.setAsync('trx_k_del', 'v_del', {});
  await client.hsetAsync('trx_h_hdel', 'f_del', 'v_del');
  await client.saddAsync('trx_s_srem', 's_rem');
  await client.zaddAsync('trx_z_zrem', 1, 'z_rem');
  await client.rpushAsync('trx_l_list_ops', ['a', 'b', 'c', 'd', 'e']);
  await client.rpushAsync('trx_l_rpoplpush_src', 'v_rpoplpush');
  await client.setAsync('trx_k_expire', 'v_expire', {});
  await client.setAsync('trx_k_pexpire', 'v_pexpire', {});

  // ---- Queue 29 commands across 5 categories ----
  const multi = bluebird.promisifyAll(client.multi());

  // Reads (8)
  multi.get('trx_k_get');
  multi.hget('trx_h_hget', 'f1');
  multi.smembers('trx_s_smembers');
  multi.hgetall('trx_h_hget');
  multi.zcard('trx_z_zcard');
  multi.scard('trx_s_smembers');
  multi.llen('trx_l_llen');
  multi.zscore('trx_z_zcard', 'z1');

  // Numerics (5)
  multi.incr('trx_num_incr'); // 101
  multi.decr('trx_num_incr'); // 100
  multi.incrby('trx_num_incr', 10); // 110
  multi.decrby('trx_num_incr', 5); // 105
  multi.hincrby('trx_h_hincrby', 'f1', 10); // 20

  // Writes (14)
  multi.del('trx_k_del');
  multi.hdel('trx_h_hdel', 'f_del');
  multi.hset('trx_h_hset', 'f_new', 'v_new');
  multi.sadd('trx_s_sadd', 's_new');
  multi.srem('trx_s_srem', 's_rem');
  multi.zadd('trx_z_zadd', 10, 'z_new');
  multi.zrem('trx_z_zrem', 'z_rem');
  multi.lpush('trx_l_list_ops', 'new_head');
  multi.rpush('trx_l_list_ops', 'new_tail');
  multi.lpop('trx_l_list_ops');
  multi.rpop('trx_l_list_ops');
  multi.lrem('trx_l_list_ops', 1, 'c');
  multi.ltrim('trx_l_list_ops', 0, 2);
  multi.rpoplpush('trx_l_rpoplpush_src', 'trx_l_rpoplpush_dest');

  // Expirations (2)
  multi.expire('trx_k_expire', 60);
  multi.pexpire('trx_k_pexpire', 60_000);

  const replies = (await multi.execAsync()) as unknown[];
  expect(replies).toHaveLength(29);

  const [
    // reads
    getKey,
    hget,
    smembers,
    hgetAll,
    zcard,
    scard,
    llen,
    zscore,
    // numerics
    incr,
    decr,
    incrby,
    decrby,
    hincrby,
    // writes
    del,
    hdel,
    hset,
    sadd,
    srem,
    zadd,
    zrem,
    lpush,
    rpush,
    lpop,
    rpop,
    lrem,
    ltrim,
    rpoplpush,
    // expirations
    expire,
    pexpire,
  ] = replies;

  // ---- Reply assertions ----
  expect(getKey).toBe('v1');
  expect(hget).toBe('v1');
  expect(smembers).toEqual(['s1']);
  expect(hgetAll).toEqual({ f1: 'v1' });
  expect(zcard).toBe(1);
  expect(scard).toBe(1);
  expect(llen).toBe(1);
  expect(Number(zscore)).toBe(1);

  expect(incr).toBe(101);
  expect(decr).toBe(100);
  expect(incrby).toBe(110);
  expect(decrby).toBe(105);
  expect(hincrby).toBe(20);

  expect(del).toBe(1);
  expect(hdel).toBe(1);
  expect(hset).toBe(1);
  expect(sadd).toBe(1);
  expect(srem).toBe(1);
  expect(zadd).toBe(1);
  expect(zrem).toBe(1);
  expect(lpush).toBe(6); // 5 initial + new_head
  expect(rpush).toBe(7); // 6 after LPUSH + new_tail
  expect(lpop).toBe('new_head');
  expect(rpop).toBe('new_tail');
  expect(lrem).toBe(1);
  expect(ltrim).toBe('OK');
  expect(rpoplpush).toBe('v_rpoplpush');

  expect(expire).toBe(1);
  expect(pexpire).toBe(1);

  // ---- Post-transaction state assertions ----
  await expect(client.getAsync('trx_k_del')).resolves.toBeNull();
  await expect(client.hgetAsync('trx_h_hdel', 'f_del')).resolves.toBeNull();
  await expect(client.hgetAsync('trx_h_hset', 'f_new')).resolves.toBe('v_new');
  await expect(client.sismemberAsync('trx_s_sadd', 's_new')).resolves.toBe(1);
  await expect(client.sismemberAsync('trx_s_srem', 's_rem')).resolves.toBe(0);
  await expect(client.zscoreAsync('trx_z_zadd', 'z_new')).resolves.toBe('10');
  await expect(client.zscoreAsync('trx_z_zrem', 'z_rem')).resolves.toBeNull();
  await expect(client.lrangeAsync('trx_l_list_ops', 0, -1)).resolves.toEqual([
    'a',
    'b',
    'd',
  ]);
  await expect(client.llenAsync('trx_l_rpoplpush_src')).resolves.toBe(0);
  await expect(
    client.lrangeAsync('trx_l_rpoplpush_dest', 0, -1),
  ).resolves.toEqual(['v_rpoplpush']);

  const ttl = await client.ttlAsync('trx_k_expire');
  expect(ttl).toBeGreaterThan(0);
  const pttl = await client.pttlAsync('trx_k_pexpire');
  expect(pttl).toBeGreaterThan(0);

  await client.shutdownAsync();
}
