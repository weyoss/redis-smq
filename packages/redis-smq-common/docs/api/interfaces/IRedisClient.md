[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisClient

# Interface: IRedisClient

## Extends

- [`EventEmitter`](../classes/EventEmitter.md)\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)\>

## Methods

### brpoplpush()

> **brpoplpush**(`source`, `destination`, `timeout`, `cb`): `void`

#### Parameters

##### source

`string`

##### destination

`string`

##### timeout

`number`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### decr()

> **decr**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### decrby()

> **decrby**(`key`, `decrement`, `cb`): `void`

#### Parameters

##### key

`string`

##### decrement

`number`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### del()

> **del**(`key`, `cb`): `void`

#### Parameters

##### key

`string` | `string`[]

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

[`EventEmitter`](../classes/EventEmitter.md).[`emit`](../classes/EventEmitter.md#emit)

---

### end()

> **end**(`flush`): `void`

#### Parameters

##### flush

`boolean`

#### Returns

`void`

---

### evalsha()

> **evalsha**(`hash`, `args`, `cb`): `void`

#### Parameters

##### hash

`string`

##### args

`string` | `number` | (`string` \| `number`)[]

##### cb

(`err?`, `res?`) => `void`

#### Returns

`void`

---

### expire()

> **expire**(`key`, `seconds`, `cb`): `void`

#### Parameters

##### key

`string`

##### seconds

`number`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### flushall()

> **flushall**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`string`\>

#### Returns

`void`

---

### get()

> **get**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### getInfo()

> **getInfo**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`string`\>

#### Returns

`void`

---

### getScriptId()

> **getScriptId**(`name`): `string` \| [`RedisClientError`](../classes/RedisClientError.md)

#### Parameters

##### name

`string`

#### Returns

`string` \| [`RedisClientError`](../classes/RedisClientError.md)

---

### halt()

> **halt**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`void`\>

#### Returns

`void`

---

### hdel()

> **hdel**(`key`, `fields`, `cb`): `void`

#### Parameters

##### key

`string`

##### fields

`string` | `string`[]

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### hget()

> **hget**(`key`, `field`, `cb`): `void`

#### Parameters

##### key

`string`

##### field

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### hgetall()

> **hgetall**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\>

#### Returns

`void`

---

### hkeys()

> **hkeys**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`string`[]\>

#### Returns

`void`

---

### hlen()

> **hlen**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### hmget()

> **hmget**(`source`, `keys`, `cb`): `void`

#### Parameters

##### source

`string`

##### keys

`string`[]

##### cb

[`ICallback`](ICallback.md)\<(`string` \| `null`)[]\>

#### Returns

`void`

---

### hscan()

> **hscan**(`key`, `cursor`, `options`, `cb`): `void`

#### Parameters

##### key

`string`

##### cursor

`string`

##### options

###### COUNT?

`number`

###### MATCH?

`string`

##### cb

[`ICallback`](ICallback.md)\<\{ `cursor`: `string`; `result`: `Record`\<`string`, `string`\>; \}\>

#### Returns

`void`

---

### hscanAll()

> **hscanAll**(`key`, `options`, `cb`): `void`

#### Parameters

##### key

`string`

##### options

###### COUNT?

`number`

###### MATCH?

`string`

##### cb

[`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\>

#### Returns

`void`

---

### hset()

> **hset**(`key`, `field`, `value`, `cb`): `void`

#### Parameters

##### key

`string`

##### field

`string`

##### value

`string` | `number`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### incr()

> **incr**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### incrby()

> **incrby**(`key`, `increment`, `cb`): `void`

#### Parameters

##### key

`string`

##### increment

`number`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### llen()

> **llen**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### lmove()

> **lmove**(`source`, `destination`, `from`, `to`, `cb`): `void`

#### Parameters

##### source

`string`

##### destination

`string`

##### from

`"LEFT"` | `"RIGHT"`

##### to

`"LEFT"` | `"RIGHT"`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### loadBuiltInScriptFiles()

> **loadBuiltInScriptFiles**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`void`\>

#### Returns

`void`

---

### loadScript()

> **loadScript**(`script`, `cb`): `void`

#### Parameters

##### script

`string`

##### cb

[`ICallback`](ICallback.md)\<`string`\>

#### Returns

`void`

---

### loadScriptFiles()

> **loadScriptFiles**(`scriptMap`, `cb`): `void`

#### Parameters

##### scriptMap

`Record`\<`string`, `string` \| `string`[]\>

##### cb

[`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\>

#### Returns

`void`

---

### lpop()

> **lpop**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### lpoprpush()

> **lpoprpush**(`source`, `destination`, `cb`): `void`

#### Parameters

##### source

`string`

##### destination

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### lpush()

> **lpush**(`key`, `elements`, `cb`): `void`

#### Parameters

##### key

`string`

##### elements

`string` | `string`[]

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### lrange()

> **lrange**(`key`, `start`, `stop`, `cb`): `void`

#### Parameters

##### key

`string`

##### start

`number`

##### stop

`number`

##### cb

[`ICallback`](ICallback.md)\<`string`[]\>

#### Returns

`void`

---

### lrem()

> **lrem**(`key`, `count`, `element`, `cb`): `void`

#### Parameters

##### key

`string`

##### count

`number`

##### element

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### ltrim()

> **ltrim**(`key`, `start`, `stop`, `cb`): `void`

#### Parameters

##### key

`string`

##### start

`number`

##### stop

`number`

##### cb

[`ICallback`](ICallback.md)\<`string`\>

#### Returns

`void`

---

### mget()

> **mget**(`keys`, `cb`): `void`

#### Parameters

##### keys

`string`[]

##### cb

[`ICallback`](ICallback.md)\<(`string` \| `null`)[]\>

#### Returns

`void`

---

### multi()

> **multi**(): [`IRedisTransaction`](IRedisTransaction.md)

#### Returns

[`IRedisTransaction`](IRedisTransaction.md)

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](../classes/EventEmitter.md).[`on`](../classes/EventEmitter.md#on)

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](../classes/EventEmitter.md).[`once`](../classes/EventEmitter.md#once)

---

### pexpire()

> **pexpire**(`key`, `milliseconds`, `cb`): `void`

#### Parameters

##### key

`string`

##### milliseconds

`number`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### ping()

> **ping**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`string`\>

#### Returns

`void`

---

### psubscribe()

> **psubscribe**(`pattern`): `void`

#### Parameters

##### pattern

`string`

#### Returns

`void`

---

### pttl()

> **pttl**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### publish()

> **publish**(`channel`, `message`, `cb`): `void`

#### Parameters

##### channel

`string`

##### message

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### punsubscribe()

> **punsubscribe**(`channel?`): `void`

#### Parameters

##### channel?

`string`

#### Returns

`void`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

[`EventEmitter`](../classes/EventEmitter.md).[`removeAllListeners`](../classes/EventEmitter.md#removealllisteners)

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](../classes/EventEmitter.md).[`removeListener`](../classes/EventEmitter.md#removelistener)

---

### rpop()

> **rpop**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### rpoplpush()

> **rpoplpush**(`source`, `destination`, `cb`): `void`

#### Parameters

##### source

`string`

##### destination

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### rpush()

> **rpush**(`key`, `elements`, `cb`): `void`

#### Parameters

##### key

`string`

##### elements

`string` | `string`[]

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### runScript()

> **runScript**(`scriptName`, `keys`, `args`, `cb`): `void`

#### Parameters

##### scriptName

`string`

##### keys

(`string` \| `number`)[]

##### args

(`string` \| `number`)[]

##### cb

[`ICallback`](ICallback.md)\<`unknown`\>

#### Returns

`void`

---

### sadd()

> **sadd**(`key`, `member`, `cb`): `void`

#### Parameters

##### key

`string`

##### member

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### scard()

> **scard**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### set()

> **set**(`key`, `value`, `options`, `cb`): `void`

#### Parameters

##### key

`string`

##### value

`string`

##### options

###### exists?

`"NX"` \| `"XX"`

###### expire?

\{ `mode`: `"EX"` \| `"PX"`; `value`: `number`; \}

###### expire.mode

`"EX"` \| `"PX"`

###### expire.value

`number`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`void`\>

#### Returns

`void`

---

### sismember()

> **sismember**(`key`, `member`, `cb`): `void`

#### Parameters

##### key

`string`

##### member

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### smembers()

> **smembers**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`string`[]\>

#### Returns

`void`

---

### srem()

> **srem**(`key`, `member`, `cb`): `void`

#### Parameters

##### key

`string`

##### member

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### sscan()

> **sscan**(`key`, `cursor`, `options`, `cb`): `void`

#### Parameters

##### key

`string`

##### cursor

`string`

##### options

###### COUNT?

`number`

###### MATCH?

`string`

##### cb

[`ICallback`](ICallback.md)\<\{ `cursor`: `string`; `items`: `string`[]; \}\>

#### Returns

`void`

---

### sscanAll()

> **sscanAll**(`key`, `options`, `cb`): `void`

#### Parameters

##### key

`string`

##### options

###### COUNT?

`number`

###### MATCH?

`string`

##### cb

[`ICallback`](ICallback.md)\<`string`[]\>

#### Returns

`void`

---

### subscribe()

> **subscribe**(`channel`): `void`

#### Parameters

##### channel

`string`

#### Returns

`void`

---

### ttl()

> **ttl**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### unsubscribe()

> **unsubscribe**(`channel?`): `void`

#### Parameters

##### channel?

`string`

#### Returns

`void`

---

### unwatch()

> **unwatch**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`string`\>

#### Returns

`void`

---

### updateServerVersion()

> **updateServerVersion**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`void`\>

#### Returns

`void`

---

### validateRedisServerSupport()

> **validateRedisServerSupport**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`void`\>

#### Returns

`void`

---

### validateRedisVersion()

> **validateRedisVersion**(`major`, `feature?`, `minor?`): `boolean`

#### Parameters

##### major

`number`

##### feature?

`number`

##### minor?

`number`

#### Returns

`boolean`

---

### watch()

> **watch**(`args`, `cb`): `void`

#### Parameters

##### args

`string`[]

##### cb

[`ICallback`](ICallback.md)\<`string`\>

#### Returns

`void`

---

### zadd()

> **zadd**(`key`, `score`, `member`, `cb`): `void`

#### Parameters

##### key

`string`

##### score

`number`

##### member

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `number`\>

#### Returns

`void`

---

### zcard()

> **zcard**(`key`, `cb`): `void`

#### Parameters

##### key

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### zcount()

> **zcount**(`key`, `min`, `max`, `cb`): `void`

#### Parameters

##### key

`string`

##### min

`string` | `number`

##### max

`string` | `number`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### zpoprpush()

> **zpoprpush**(`source`, `destination`, `cb`): `void`

#### Parameters

##### source

`string`

##### destination

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`

---

### zrange()

> **zrange**(`key`, `min`, `max`, `cb`): `void`

#### Parameters

##### key

`string`

##### min

`number`

##### max

`number`

##### cb

[`ICallback`](ICallback.md)\<`string`[]\>

#### Returns

`void`

---

### zrangebyscore()

> **zrangebyscore**(`key`, `min`, `max`, `offset`, `count`, `cb`): `void`

#### Parameters

##### key

`string`

##### min

`string` | `number`

##### max

`string` | `number`

##### offset

`number`

##### count

`number`

##### cb

[`ICallback`](ICallback.md)\<`string`[]\>

#### Returns

`void`

---

### zrangebyscorewithscores()

> **zrangebyscorewithscores**(`source`, `min`, `max`, `cb`): `void`

#### Parameters

##### source

`string`

##### min

`string` | `number`

##### max

`string` | `number`

##### cb

[`ICallback`](ICallback.md)\<`Record`\<`string`, `string`\>\>

#### Returns

`void`

---

### zrem()

> **zrem**(`source`, `id`, `cb`): `void`

#### Parameters

##### source

`string`

##### id

`string`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### zremrangebyscore()

> **zremrangebyscore**(`source`, `min`, `max`, `cb`): `void`

#### Parameters

##### source

`string`

##### min

`string` | `number`

##### max

`string` | `number`

##### cb

[`ICallback`](ICallback.md)\<`number`\>

#### Returns

`void`

---

### zrevrange()

> **zrevrange**(`key`, `min`, `max`, `cb`): `void`

#### Parameters

##### key

`string`

##### min

`number`

##### max

`number`

##### cb

[`ICallback`](ICallback.md)\<`string`[]\>

#### Returns

`void`

---

### zscan()

> **zscan**(`key`, `cursor`, `options`, `cb`): `void`

#### Parameters

##### key

`string`

##### cursor

`string`

##### options

###### COUNT?

`number`

###### MATCH?

`string`

##### cb

[`ICallback`](ICallback.md)\<\{ `cursor`: `string`; `items`: `string`[]; \}\>

#### Returns

`void`

---

### zscore()

> **zscore**(`key`, `member`, `cb`): `void`

#### Parameters

##### key

`string`

##### member

`string`

##### cb

[`ICallback`](ICallback.md)\<`string` \| `null`\>

#### Returns

`void`
