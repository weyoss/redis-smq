[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBusRedisFactory

# Class: EventBusRedisFactory\<Event\>

## Extends

- [`EventEmitter`](EventEmitter.md)\<`Pick`\<[`TRedisClientEvent`](../type-aliases/TRedisClientEvent.md), `"error"`\>\>

## Type Parameters

### Event

`Event` *extends* [`TEventBusEvent`](../type-aliases/TEventBusEvent.md)

## Constructors

### Constructor

> **new EventBusRedisFactory**\<`Event`\>(`config`): `EventBusRedisFactory`\<`Event`\>

#### Parameters

##### config

[`IRedisConfig`](../interfaces/IRedisConfig.md)

#### Returns

`EventBusRedisFactory`\<`Event`\>

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

> **getInstance**(): `Error` \| [`IEventBus`](../interfaces/IEventBus.md)\<`Event`\>

#### Returns

`Error` \| [`IEventBus`](../interfaces/IEventBus.md)\<`Event`\>

***

### getSetInstance()

> **getSetInstance**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<[`IEventBus`](../interfaces/IEventBus.md)\<`Event`\>\>

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
