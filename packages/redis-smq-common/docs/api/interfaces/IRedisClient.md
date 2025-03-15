[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisClient

# Interface: IRedisClient

## Hierarchy

- [`EventEmitter`](../classes/EventEmitter.md)\<[`TRedisClientEvent`](../README.md#tredisclientevent)\>

  ↳ **`IRedisClient`**

## Table of contents

### Methods

- [brpoplpush](IRedisClient.md#brpoplpush)
- [del](IRedisClient.md#del)
- [emit](IRedisClient.md#emit)
- [end](IRedisClient.md#end)
- [evalsha](IRedisClient.md#evalsha)
- [flushall](IRedisClient.md#flushall)
- [get](IRedisClient.md#get)
- [getInfo](IRedisClient.md#getinfo)
- [getScriptId](IRedisClient.md#getscriptid)
- [halt](IRedisClient.md#halt)
- [hdel](IRedisClient.md#hdel)
- [hget](IRedisClient.md#hget)
- [hgetall](IRedisClient.md#hgetall)
- [hkeys](IRedisClient.md#hkeys)
- [hlen](IRedisClient.md#hlen)
- [hmget](IRedisClient.md#hmget)
- [hscan](IRedisClient.md#hscan)
- [hscanAll](IRedisClient.md#hscanall)
- [hset](IRedisClient.md#hset)
- [llen](IRedisClient.md#llen)
- [lmove](IRedisClient.md#lmove)
- [loadBuiltInScriptFiles](IRedisClient.md#loadbuiltinscriptfiles)
- [loadScript](IRedisClient.md#loadscript)
- [loadScriptFiles](IRedisClient.md#loadscriptfiles)
- [lpoprpush](IRedisClient.md#lpoprpush)
- [lrange](IRedisClient.md#lrange)
- [lrem](IRedisClient.md#lrem)
- [multi](IRedisClient.md#multi)
- [on](IRedisClient.md#on)
- [once](IRedisClient.md#once)
- [psubscribe](IRedisClient.md#psubscribe)
- [publish](IRedisClient.md#publish)
- [punsubscribe](IRedisClient.md#punsubscribe)
- [removeAllListeners](IRedisClient.md#removealllisteners)
- [removeListener](IRedisClient.md#removelistener)
- [rpop](IRedisClient.md#rpop)
- [rpoplpush](IRedisClient.md#rpoplpush)
- [runScript](IRedisClient.md#runscript)
- [sadd](IRedisClient.md#sadd)
- [set](IRedisClient.md#set)
- [shutdown](IRedisClient.md#shutdown)
- [sismember](IRedisClient.md#sismember)
- [smembers](IRedisClient.md#smembers)
- [srem](IRedisClient.md#srem)
- [sscan](IRedisClient.md#sscan)
- [sscanAll](IRedisClient.md#sscanall)
- [subscribe](IRedisClient.md#subscribe)
- [unsubscribe](IRedisClient.md#unsubscribe)
- [unwatch](IRedisClient.md#unwatch)
- [updateServerVersion](IRedisClient.md#updateserverversion)
- [validateRedisServerSupport](IRedisClient.md#validateredisserversupport)
- [validateRedisVersion](IRedisClient.md#validateredisversion)
- [watch](IRedisClient.md#watch)
- [zadd](IRedisClient.md#zadd)
- [zcard](IRedisClient.md#zcard)
- [zpoprpush](IRedisClient.md#zpoprpush)
- [zrange](IRedisClient.md#zrange)
- [zrangebyscore](IRedisClient.md#zrangebyscore)
- [zrangebyscorewithscores](IRedisClient.md#zrangebyscorewithscores)
- [zrem](IRedisClient.md#zrem)
- [zremrangebyscore](IRedisClient.md#zremrangebyscore)
- [zrevrange](IRedisClient.md#zrevrange)
- [zscan](IRedisClient.md#zscan)

## Methods

### brpoplpush

▸ **brpoplpush**(`source`, `destination`, `timeout`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `destination` | `string` |
| `timeout` | `number` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### del

▸ **del**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` \| `string`[] |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TRedisClientEvent`](../README.md#tredisclientevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<[`TRedisClientEvent`](../README.md#tredisclientevent)[`E`]\> |

#### Returns

`boolean`

#### Inherited from

[EventEmitter](../classes/EventEmitter.md).[emit](../classes/EventEmitter.md#emit)

___

### end

▸ **end**(`flush`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `flush` | `boolean` |

#### Returns

`void`

___

### evalsha

▸ **evalsha**(`hash`, `args`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |
| `args` | `string` \| `number` \| (`string` \| `number`)[] |
| `cb` | (`err?`: ``null`` \| `Error`, `res?`: `unknown`) => `void` |

#### Returns

`void`

___

### flushall

▸ **flushall**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`string`\> |

#### Returns

`void`

___

### get

▸ **get**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### getInfo

▸ **getInfo**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`string`\> |

#### Returns

`void`

___

### getScriptId

▸ **getScriptId**(`name`): `string` \| [`RedisClientError`](../classes/RedisClientError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`string` \| [`RedisClientError`](../classes/RedisClientError.md)

___

### halt

▸ **halt**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`void`\> |

#### Returns

`void`

___

### hdel

▸ **hdel**(`key`, `fields`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `fields` | `string` \| `string`[] |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### hget

▸ **hget**(`key`, `field`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `field` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### hgetall

▸ **hgetall**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\> |

#### Returns

`void`

___

### hkeys

▸ **hkeys**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`string`[]\> |

#### Returns

`void`

___

### hlen

▸ **hlen**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### hmget

▸ **hmget**(`source`, `keys`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `keys` | `string`[] |
| `cb` | [`ICallback`](ICallback.md)\<(``null`` \| `string`)[]\> |

#### Returns

`void`

___

### hscan

▸ **hscan**(`key`, `cursor`, `options`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cursor` | `string` |
| `options` | `Object` |
| `options.COUNT?` | `number` |
| `options.MATCH?` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<\{ `cursor`: `string` ; `result`: `Record`\<`string`, `string`\>  }\> |

#### Returns

`void`

___

### hscanAll

▸ **hscanAll**(`key`, `options`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `options` | `Object` |
| `options.COUNT?` | `number` |
| `options.MATCH?` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\> |

#### Returns

`void`

___

### hset

▸ **hset**(`key`, `field`, `value`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `field` | `string` |
| `value` | `string` \| `number` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### llen

▸ **llen**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### lmove

▸ **lmove**(`source`, `destination`, `from`, `to`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `destination` | `string` |
| `from` | ``"LEFT"`` \| ``"RIGHT"`` |
| `to` | ``"LEFT"`` \| ``"RIGHT"`` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### loadBuiltInScriptFiles

▸ **loadBuiltInScriptFiles**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`void`\> |

#### Returns

`void`

___

### loadScript

▸ **loadScript**(`script`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `script` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`string`\> |

#### Returns

`void`

___

### loadScriptFiles

▸ **loadScriptFiles**(`scriptMap`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `scriptMap` | `Record`\<`string`, `string`\> |
| `cb` | [`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\> |

#### Returns

`void`

___

### lpoprpush

▸ **lpoprpush**(`source`, `destination`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `destination` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### lrange

▸ **lrange**(`key`, `start`, `stop`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `start` | `number` |
| `stop` | `number` |
| `cb` | [`ICallback`](ICallback.md)\<`string`[]\> |

#### Returns

`void`

___

### lrem

▸ **lrem**(`key`, `count`, `element`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `count` | `number` |
| `element` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### multi

▸ **multi**(): [`IRedisTransaction`](IRedisTransaction.md)

#### Returns

[`IRedisTransaction`](IRedisTransaction.md)

___

### on

▸ **on**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TRedisClientEvent`](../README.md#tredisclientevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TRedisClientEvent`](../README.md#tredisclientevent)[`E`] |

#### Returns

`this`

#### Inherited from

[EventEmitter](../classes/EventEmitter.md).[on](../classes/EventEmitter.md#on)

___

### once

▸ **once**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TRedisClientEvent`](../README.md#tredisclientevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TRedisClientEvent`](../README.md#tredisclientevent)[`E`] |

#### Returns

`this`

#### Inherited from

[EventEmitter](../classes/EventEmitter.md).[once](../classes/EventEmitter.md#once)

___

### psubscribe

▸ **psubscribe**(`pattern`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pattern` | `string` |

#### Returns

`void`

___

### publish

▸ **publish**(`channel`, `message`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `channel` | `string` |
| `message` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### punsubscribe

▸ **punsubscribe**(`channel?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `channel?` | `string` |

#### Returns

`void`

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TRedisClientEvent`](../README.md#tredisclientevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

`this`

#### Inherited from

[EventEmitter](../classes/EventEmitter.md).[removeAllListeners](../classes/EventEmitter.md#removealllisteners)

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TRedisClientEvent`](../README.md#tredisclientevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TRedisClientEvent`](../README.md#tredisclientevent)[`E`] |

#### Returns

`this`

#### Inherited from

[EventEmitter](../classes/EventEmitter.md).[removeListener](../classes/EventEmitter.md#removelistener)

___

### rpop

▸ **rpop**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### rpoplpush

▸ **rpoplpush**(`source`, `destination`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `destination` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### runScript

▸ **runScript**(`scriptName`, `keys`, `args`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `scriptName` | `string` |
| `keys` | (`string` \| `number`)[] |
| `args` | (`string` \| `number`)[] |
| `cb` | [`ICallback`](ICallback.md)\<`unknown`\> |

#### Returns

`void`

___

### sadd

▸ **sadd**(`key`, `member`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `member` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### set

▸ **set**(`key`, `value`, `options`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `value` | `string` |
| `options` | `Object` |
| `options.exists?` | ``"NX"`` \| ``"XX"`` |
| `options.expire?` | `Object` |
| `options.expire.mode` | ``"EX"`` \| ``"PX"`` |
| `options.expire.value` | `number` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`void`\> |

#### Returns

`void`

___

### sismember

▸ **sismember**(`key`, `member`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `member` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### smembers

▸ **smembers**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`string`[]\> |

#### Returns

`void`

___

### srem

▸ **srem**(`key`, `member`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `member` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### sscan

▸ **sscan**(`key`, `cursor`, `options`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cursor` | `string` |
| `options` | `Object` |
| `options.COUNT?` | `number` |
| `options.MATCH?` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<\{ `cursor`: `string` ; `items`: `string`[]  }\> |

#### Returns

`void`

___

### sscanAll

▸ **sscanAll**(`key`, `options`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `options` | `Object` |
| `options.COUNT?` | `number` |
| `options.MATCH?` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`string`[]\> |

#### Returns

`void`

___

### subscribe

▸ **subscribe**(`channel`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `channel` | `string` |

#### Returns

`void`

___

### unsubscribe

▸ **unsubscribe**(`channel?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `channel?` | `string` |

#### Returns

`void`

___

### unwatch

▸ **unwatch**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`string`\> |

#### Returns

`void`

___

### updateServerVersion

▸ **updateServerVersion**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`void`\> |

#### Returns

`void`

___

### validateRedisServerSupport

▸ **validateRedisServerSupport**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`void`\> |

#### Returns

`void`

___

### validateRedisVersion

▸ **validateRedisVersion**(`major`, `feature?`, `minor?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `major` | `number` |
| `feature?` | `number` |
| `minor?` | `number` |

#### Returns

`boolean`

___

### watch

▸ **watch**(`args`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `string`[] |
| `cb` | [`ICallback`](ICallback.md)\<`string`\> |

#### Returns

`void`

___

### zadd

▸ **zadd**(`key`, `score`, `member`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `score` | `number` |
| `member` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`string` \| `number`\> |

#### Returns

`void`

___

### zcard

▸ **zcard**(`key`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### zpoprpush

▸ **zpoprpush**(`source`, `destination`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `destination` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<``null`` \| `string`\> |

#### Returns

`void`

___

### zrange

▸ **zrange**(`key`, `min`, `max`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `min` | `number` |
| `max` | `number` |
| `cb` | [`ICallback`](ICallback.md)\<`string`[]\> |

#### Returns

`void`

___

### zrangebyscore

▸ **zrangebyscore**(`key`, `min`, `max`, `offset`, `count`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `min` | `string` \| `number` |
| `max` | `string` \| `number` |
| `offset` | `number` |
| `count` | `number` |
| `cb` | [`ICallback`](ICallback.md)\<`string`[]\> |

#### Returns

`void`

___

### zrangebyscorewithscores

▸ **zrangebyscorewithscores**(`source`, `min`, `max`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `min` | `number` |
| `max` | `number` |
| `cb` | [`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\> |

#### Returns

`void`

___

### zrem

▸ **zrem**(`source`, `id`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `id` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### zremrangebyscore

▸ **zremrangebyscore**(`source`, `min`, `max`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `min` | `string` \| `number` |
| `max` | `string` \| `number` |
| `cb` | [`ICallback`](ICallback.md)\<`number`\> |

#### Returns

`void`

___

### zrevrange

▸ **zrevrange**(`key`, `min`, `max`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `min` | `number` |
| `max` | `number` |
| `cb` | [`ICallback`](ICallback.md)\<`string`[]\> |

#### Returns

`void`

___

### zscan

▸ **zscan**(`key`, `cursor`, `options`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `cursor` | `string` |
| `options` | `Object` |
| `options.COUNT?` | `number` |
| `options.MATCH?` | `string` |
| `cb` | [`ICallback`](ICallback.md)\<\{ `cursor`: `string` ; `items`: `string`[]  }\> |

#### Returns

`void`
