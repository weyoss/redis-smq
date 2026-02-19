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
import { env } from '../../src/env/index.js';
import { IRedisConfig } from '../../src/redis-client/index.js';
import { getRedisInstance } from '../common.js';

export async function standardCommands(config: IRedisConfig) {
  const client = await getRedisInstance(config);

  // ping
  const rPing = await client.pingAsync();
  expect(rPing).toBe('PONG');

  // set, get, del
  await client.setAsync('key1', 'value', {});
  const rGet = await client.getAsync('key1');
  expect(rGet).toBe('value');
  const rDel = await client.delAsync('key1');
  expect(rDel).toBe(1);

  // mget
  await client.setAsync('keyA', 'valueA', {});
  await client.setAsync('keyB', 'valueB', {});
  const rMget = await client.mgetAsync(['keyA', 'keyB', 'keyC']);
  expect(rMget).toEqual(['valueA', 'valueB', null]);

  // set with PX
  await client.setAsync('key2', 'value', {
    expire: { mode: 'PX', value: 10000 },
  });

  // set with NX
  await client.setAsync('key3', 'value', {
    expire: { mode: 'PX', value: 10000 },
    exists: 'NX',
  });

  // expire, pexpire, ttl, pttl
  await client.expireAsync('keyA', 20);
  const rTTL = await client.ttlAsync('keyA');
  expect(rTTL).toBeGreaterThan(0);
  expect(rTTL).toBeLessThanOrEqual(20);

  await client.pexpireAsync('keyB', 20000);
  const rPTTL = await client.pttlAsync('keyB');
  expect(rPTTL).toBeGreaterThan(0);
  expect(rPTTL).toBeLessThanOrEqual(20000);

  // zset commands
  await client.zaddAsync('zset1', 100, 'zvalue1');
  await client.zaddAsync('zset1', 200, 'zvalue2');
  await client.zaddAsync('zset1', 300, 'zvalue3');
  const rZcard = await client.zcardAsync('zset1');
  expect(rZcard).toBe(3);

  const rZscore = await client.zscoreAsync('zset1', 'zvalue2');
  expect(rZscore).toBe('200');

  const rZscoreNull = await client.zscoreAsync('zset1', 'zvalue_invalid');
  expect(rZscoreNull).toBe(null);

  const rZrange = await client.zrangeAsync('zset1', 0, 2);
  expect(rZrange).toEqual(['zvalue1', 'zvalue2', 'zvalue3']);

  const rZscan = await client.zscanAsync('zset1', '0', {});
  expect(rZscan.items).toBeDefined();
  expect(rZscan.cursor).toBeDefined();

  const rZrevrange = await client.zrevrangeAsync('zset1', 0, 2);
  expect(rZrevrange).toEqual(['zvalue3', 'zvalue2', 'zvalue1']);

  const rZrangebyscore = await client.zrangebyscoreAsync(
    'zset1',
    100,
    200,
    0,
    10,
  );
  expect(rZrangebyscore).toEqual(['zvalue1', 'zvalue2']);

  const rZrangebyscorewithscores = await client.zrangebyscorewithscoresAsync(
    'zset1',
    '-inf',
    '+inf',
  );
  expect(rZrangebyscorewithscores).toEqual({
    100: 'zvalue1',
    200: 'zvalue2',
    300: 'zvalue3',
  });

  const rZcount = await client.zcountAsync('zset1', 100, 200);
  expect(rZcount).toBe(2);

  const rZrem = await client.zremAsync('zset1', 'zvalue2');
  expect(rZrem).toBe(1);
  expect(await client.zcardAsync('zset1')).toBe(2);

  const rZpoprpush = await client.zpoprpushAsync('zset1', 'list0');
  expect(rZpoprpush).toBe('zvalue1');
  expect(await client.zcardAsync('zset1')).toBe(1);
  expect(await client.llenAsync('list0')).toBe(1);

  const rZremrangebyscore = await client.zremrangebyscoreAsync('zset1', 0, 300);
  expect(rZremrangebyscore).toEqual(1);

  // set commands
  await client.saddAsync('set1', 'svalue1');
  await client.saddAsync('set1', 'svalue2');
  const rSismember = await client.sismemberAsync('set1', 'svalue1');
  expect(rSismember).toEqual(1);

  const rSmembers = await client.smembersAsync('set1');
  expect(rSmembers.sort()).toEqual(['svalue1', 'svalue2']);

  const rScard = await client.scardAsync('set1');
  expect(rScard).toEqual(2);

  // sscan
  const sscan1 = await client.sscanAsync('set1', '0', { COUNT: 2 });
  expect(sscan1.items).toBeDefined();
  expect(sscan1.cursor).toBeDefined();

  // hash commands
  await client.hsetAsync('hset1', 'f1', 'v1');
  await client.hsetAsync('hset1', 'f2', 'v2');
  const rHget = await client.hgetAsync('hset1', 'f1');
  expect(rHget).toBe('v1');

  const rHmget = await client.hmgetAsync('hset1', ['f1', 'f2']);
  expect(rHmget).toEqual(['v1', 'v2']);

  const rHgetall = await client.hgetallAsync('hset1');
  expect(rHgetall).toEqual({ f1: 'v1', f2: 'v2' });

  const rHkeys = await client.hkeysAsync('hset1');
  expect(rHkeys.sort()).toEqual(['f1', 'f2']);

  const rHlen = await client.hlenAsync('hset1');
  expect(rHlen).toEqual(2);

  // hscan
  const hscan1 = await client.hscanAsync('hset1', '0', { COUNT: 2 });
  expect(hscan1.result).toBeDefined();
  expect(hscan1.cursor).toBeDefined();

  const rHdel = await client.hdelAsync('hset1', 'f1');
  expect(rHdel).toEqual(1);

  // numeric commands
  await client.setAsync('numKey', '10', {});
  const rIncr = await client.incrAsync('numKey');
  expect(rIncr).toBe(11);
  const rIncrby = await client.incrbyAsync('numKey', 9);
  expect(rIncrby).toBe(20);
  const rDecr = await client.decrAsync('numKey');
  expect(rDecr).toBe(19);
  const rDecrby = await client.decrbyAsync('numKey', 9);
  expect(rDecrby).toBe(10);

  // list commands
  expect(await client.llenAsync('list1')).toEqual(0);
  expect(await client.lrangeAsync('list1', 0, 100)).toEqual([]);
  expect(await client.brpoplpushAsync('list1', 'list2', 1)).toEqual(null);

  await client.rpushAsync('list1', ['a', 'b', 'c']);
  expect(await client.llenAsync('list1')).toBe(3);
  expect(await client.lindexAsync('list1', 0)).toBe('a');

  const rLpop = await client.lpopAsync('list1');
  expect(rLpop).toBe('a');
  expect(await client.llenAsync('list1')).toBe(2);

  await client.lpushAsync('list1', 'd');
  expect(await client.lrangeAsync('list1', 0, -1)).toEqual(['d', 'b', 'c']);

  const rRpop = await client.rpopAsync('list1');
  expect(rRpop).toBe('c');
  expect(await client.llenAsync('list1')).toBe(2);

  const rRpoplpush = await client.rpoplpushAsync('list1', 'list2');
  expect(rRpoplpush).toBe('b');
  expect(await client.lrangeAsync('list1', 0, -1)).toEqual(['d']);
  expect(await client.lrangeAsync('list2', 0, -1)).toEqual(['b']);

  const rLpoprpush = await client.lpoprpushAsync('list1', 'list2');
  expect(rLpoprpush).toBe('d');
  expect(await client.llenAsync('list1')).toBe(0);
  expect(await client.lrangeAsync('list2', 0, -1)).toEqual(['b', 'd']);

  await client.rpushAsync('list3', ['x', 'y', 'x', 'z']);
  const rLrem = await client.lremAsync('list3', 2, 'x');
  expect(rLrem).toBe(2);
  expect(await client.lrangeAsync('list3', 0, -1)).toEqual(['y', 'z']);

  const rLtrim = await client.ltrimAsync('list3', 1, 1);
  expect(rLtrim).toBe('OK');
  expect(await client.lrangeAsync('list3', 0, -1)).toEqual(['z']);

  // lmove
  if (client.validateRedisVersion(6, 2)) {
    await client.rpushAsync('lmove_src', ['a', 'b', 'c']);
    const rLmove1 = await client.lmoveAsync(
      'lmove_src',
      'lmove_dest',
      'LEFT',
      'RIGHT',
    );
    expect(rLmove1).toBe('a');
    expect(await client.lrangeAsync('lmove_src', 0, -1)).toEqual(['b', 'c']);
    expect(await client.lrangeAsync('lmove_dest', 0, -1)).toEqual(['a']);

    const rLmove2 = await client.lmoveAsync(
      'lmove_src',
      'lmove_dest',
      'RIGHT',
      'LEFT',
    );
    expect(rLmove2).toBe('c');
    expect(await client.lrangeAsync('lmove_src', 0, -1)).toEqual(['b']);
    expect(await client.lrangeAsync('lmove_dest', 0, -1)).toEqual(['c', 'a']);
  }

  // watch/unwatch
  await client.watchAsync(['key7']);
  await client.unwatchAsync();

  // info
  const rInfo = await client.getInfoAsync();
  expect(typeof rInfo).toBe('string');

  // sscanAll
  const members: number[] = [];
  for (let i = 0; i < 1000; i += 1) {
    await client.saddAsync('set2', `${i}`);
    members.push(i);
  }
  const rSscanall = await client.sscanAllAsync('set2', {});
  expect(rSscanall.map((i) => Number(i)).sort((a, b) => a - b)).toEqual(
    members,
  );

  // srem
  await client.sremAsync('set2', '0');

  // sscanAll with MATCH
  if (client.validateRedisVersion(2, 8)) {
    const m2 = await client.sscanAllAsync('set2', { MATCH: '9*', COUNT: 10 });
    expect(m2.map((i) => Number(i)).sort((a, b) => a - b)).toEqual(
      members
        .filter((i) => i !== 0 && String(i).startsWith('9'))
        .sort((a, b) => a - b),
    );
  }

  // hscanAll
  for (let i = 0; i < 1100; i += 1) {
    await client.hsetAsync('hset2', `k${i}`, `v${i}`);
  }
  const rHscanall2 = await client.hscanAllAsync('hset2', {});
  expect(Object.keys(rHscanall2 ?? {}).length).toEqual(1100);

  // cleanup and shutdown
  await client.flushallAsync();
  await client.shutdownAsync(); // does exec quit command
  await client.shutdownAsync(); // does not exec quit
  await client.haltAsync(); // test halt idempotency
}

export async function scriptRunning(config: IRedisConfig) {
  const dir = env.getCurrentDir();
  const client = await getRedisInstance(config);
  await client.loadScriptFilesAsync({
    test_script: resolve(dir, './lua-scripts/test_script.lua'),
  });
  const r = await client.runScriptAsync('test_script', [], []);
  expect(r).toBe(1);
  await client.shutdownAsync();
}

export async function pubSubPattern(config: IRedisConfig) {
  const subscribeClient = await getRedisInstance(config);
  const publishClient = await getRedisInstance(config);

  const messagePromise = new Promise<{
    pattern: string;
    channel: string;
    message: string;
  }>((resolve, reject) => {
    subscribeClient.psubscribe('chan*');
    subscribeClient.on(
      'pmessage',
      (pattern: string, channel: string, message: string) => {
        resolve({ pattern, channel, message });
      },
    );
    setTimeout(() => reject(new Error('PUB/SUB pattern test timed out')), 5000);
  });

  // Allow a brief moment for the subscription to be established
  await bluebird.delay(100);
  await publishClient.publishAsync('chan1', 'msg1');

  const received = await messagePromise;
  expect(received).toEqual({
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

  const messagePromise = new Promise<{ channel: string; message: string }>(
    (resolve, reject) => {
      subscribeClient.subscribe('chan1');
      subscribeClient.on('message', (channel: string, message: string) => {
        resolve({ channel, message });
      });
      setTimeout(
        () => reject(new Error('PUB/SUB channel test timed out')),
        5000,
      );
    },
  );

  // Allow a brief moment for the subscription to be established
  await bluebird.delay(100);
  await publishClient.publishAsync('chan1', 'msg1');

  const received = await messagePromise;
  expect(received).toEqual({
    channel: 'chan1',
    message: 'msg1',
  });

  subscribeClient.unsubscribe('chan1');
  await subscribeClient.shutdownAsync();
  await publishClient.shutdownAsync();
}

export async function transactionRunning(config: IRedisConfig) {
  const client = await getRedisInstance(config);

  // 1. Setup Phase: Create initial data for the transaction to modify
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

  // 2. Transaction Phase
  const multi = bluebird.promisifyAll(client.multi());

  // Read commands (8)
  multi.get('trx_k_get');
  multi.hget('trx_h_hget', 'f1');
  multi.smembers('trx_s_smembers');
  multi.hgetall('trx_h_hget');
  multi.zcard('trx_z_zcard');
  multi.scard('trx_s_smembers');
  multi.llen('trx_l_llen');
  multi.zscore('trx_z_zcard', 'z1');

  // Numeric commands (5)
  multi.incr('trx_num_incr');
  multi.decr('trx_num_incr'); // back to 100
  multi.incrby('trx_num_incr', 10); // 110
  multi.decrby('trx_num_incr', 5); // 105
  multi.hincrby('trx_h_hincrby', 'f1', 10); // 20

  // Write commands (14)
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

  // Expiration commands (2)
  multi.expire('trx_k_expire', 60);
  multi.pexpire('trx_k_pexpire', 60000);

  // 3. Assertion Phase 1 (Transaction Reply)
  const r: unknown[] = await multi.execAsync();
  expect(Array.isArray(r)).toBe(true);
  expect(r.length).toEqual(29);

  const [
    // Read results
    getKeyResult,
    hgetResult,
    smembersResult,
    hgetAllResult,
    zcardResult,
    scardResult,
    llenResult,
    zscoreResult,

    // Numeric results
    incrResult,
    decrResult,
    incrbyResult,
    decrbyResult,
    hincrbyResult,

    // Write results
    delResult,
    hdelResult,
    hsetResult,
    saddResult,
    sremResult,
    zaddResult,
    zremResult,
    lpushResult,
    rpushResult,
    lpopResult,
    rpopResult,
    lremResult,
    ltrimResult,
    rpoplpushResult,

    // Expiration results
    expireResult,
    pexpireResult,
  ] = r;

  // Assert read command results
  expect(getKeyResult).toBe('v1');
  expect(hgetResult).toBe('v1');
  expect(smembersResult).toEqual(['s1']);
  expect(hgetAllResult).toEqual({ f1: 'v1' });
  expect(zcardResult).toBe(1);
  expect(scardResult).toBe(1);
  expect(llenResult).toBe(1);
  expect(Number(zscoreResult)).toBe(1);

  // Assert numeric command results
  expect(incrResult).toBe(101);
  expect(decrResult).toBe(100);
  expect(incrbyResult).toBe(110);
  expect(decrbyResult).toBe(105);
  expect(hincrbyResult).toBe(20);

  // Assert write command results (return values)
  expect(delResult).toBe(1);
  expect(hdelResult).toBe(1);
  expect(hsetResult).toBe(1);
  expect(saddResult).toBe(1);
  expect(sremResult).toBe(1);
  expect(zaddResult).toBe(1);
  expect(zremResult).toBe(1);
  expect(lpushResult).toBe(6); // 5 initial + 1 new
  expect(rpushResult).toBe(7); // 6 + 1 new
  expect(lpopResult).toBe('new_head');
  expect(rpopResult).toBe('new_tail');
  expect(lremResult).toBe(1);
  expect(ltrimResult).toBe('OK');
  expect(rpoplpushResult).toBe('v_rpoplpush');

  // Assert expiration command results
  expect(expireResult).toBe(1);
  expect(pexpireResult).toBe(1);

  // 4. Assertion Phase 2 (Post-Transaction State)
  expect(await client.getAsync('trx_k_del')).toBe(null);
  expect(await client.hgetAsync('trx_h_hdel', 'f_del')).toBe(null);
  expect(await client.hgetAsync('trx_h_hset', 'f_new')).toBe('v_new');
  expect(await client.sismemberAsync('trx_s_sadd', 's_new')).toBe(1);
  expect(await client.sismemberAsync('trx_s_srem', 's_rem')).toBe(0);
  expect(await client.zscoreAsync('trx_z_zadd', 'z_new')).toBe('10');
  expect(await client.zscoreAsync('trx_z_zrem', 'z_rem')).toBe(null);
  expect(await client.lrangeAsync('trx_l_list_ops', 0, -1)).toEqual([
    'a',
    'b',
    'd',
  ]);
  expect(await client.llenAsync('trx_l_rpoplpush_src')).toBe(0);
  expect(await client.lrangeAsync('trx_l_rpoplpush_dest', 0, -1)).toEqual([
    'v_rpoplpush',
  ]);
  expect(await client.ttlAsync('trx_k_expire')).toBeGreaterThan(0);
  expect(await client.pttlAsync('trx_k_pexpire')).toBeGreaterThan(0);

  await client.shutdownAsync();
}
