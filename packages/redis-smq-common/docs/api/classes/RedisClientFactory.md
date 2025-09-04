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

`E` *extends* `"error"`

#### Parameters

##### event

`E`

##### args

...`Parameters`\<`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

***

### getInstance()

> **getInstance**(): `Error` \| [`IRedisClient`](../interfaces/IRedisClient.md)

#### Returns

`Error` \| [`IRedisClient`](../interfaces/IRedisClient.md)

***

### getSetInstance()

> **getSetInstance**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<[`IRedisClient`](../interfaces/IRedisClient.md)\>

#### Returns

`void`

***

### init()

> **init**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

#### Returns

`void`

***

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `"error"`

#### Parameters

##### event

`E`

##### listener

`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`on`](EventEmitter.md#on)

***

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `"error"`

#### Parameters

##### event

`E`

##### listener

`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`once`](EventEmitter.md#once)

***

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` *extends* `"error"`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeAllListeners`](EventEmitter.md#removealllisteners)

***

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `"error"`

#### Parameters

##### event

`E`

##### listener

`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeListener`](EventEmitter.md#removelistener)

***

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

#### Returns

`void`
