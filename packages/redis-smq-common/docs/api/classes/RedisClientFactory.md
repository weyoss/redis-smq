[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisClientFactory

# Class: RedisClientFactory

## Extends

- [`EventEmitter`](EventEmitter.md)\<`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\>

## Constructors

### Constructor

> **new RedisClientFactory**(`config`): `RedisClientFactory`

#### Parameters

##### config

[`IRedisConfig`](../interfaces/IRedisConfig.md)

#### Returns

`RedisClientFactory`

#### Overrides

[`EventEmitter`](EventEmitter.md).[`constructor`](EventEmitter.md#constructor)

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ `"error"`

#### Parameters

##### event

`E`

##### args

...`Parameters`\<`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

---

### getInstance()

> **getInstance**(): [`IRedisClient`](../interfaces/IRedisClient.md)

Returns the connected client.

#### Returns

[`IRedisClient`](../interfaces/IRedisClient.md)

#### Throws

if `init()` has not yet succeeded. This is a
programming error — a caller who needs the client should call
`init()` first, or use `getSetInstance()` (which initializes on
demand). Calling `getInstance()` before init is a lifecycle bug,
not a recoverable state.

---

### getSetInstance()

> **getSetInstance**(`cb`): `void`

Returns the client instance, initializing it first if necessary.

Concurrent calls: the first caller locks the factory, creates the
client, and unlocks when done. Subsequent callers during the locked
window receive `InstanceLockError` — this is fail-fast, not queueing.
Callers that expect concurrency should either serialize their init
calls or handle `InstanceLockError` and retry.

For a non-initializing accessor, use `getInstance()` instead — it
returns the already-initialized client and throws `PanicError` if
`init()` has not yet succeeded.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<[`IRedisClient`](../interfaces/IRedisClient.md)\>

#### Returns

`void`

---

### init()

> **init**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)

#### Returns

`void`

---

### listenerCount()

> **listenerCount**\<`E`\>(`event`): `number`

#### Type Parameters

##### E

`E` _extends_ `"error"`

#### Parameters

##### event

`E`

#### Returns

`number`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`listenerCount`](EventEmitter.md#listenercount)

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `"error"`

#### Parameters

##### event

`E`

##### listener

`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`on`](EventEmitter.md#on)

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `"error"`

#### Parameters

##### event

`E`

##### listener

`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`once`](EventEmitter.md#once)

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ `"error"`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeAllListeners`](EventEmitter.md#removealllisteners)

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `"error"`

#### Parameters

##### event

`E`

##### listener

`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeListener`](EventEmitter.md#removelistener)

---

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)

#### Returns

`void`
