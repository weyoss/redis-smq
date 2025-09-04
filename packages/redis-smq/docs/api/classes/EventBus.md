[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBus

# Class: EventBus

## Extends

- `EventBusRedisFactory`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

## Constructors

### Constructor

> **new EventBus**(): `EventBus`

#### Returns

`EventBus`

#### Overrides

`EventBusRedisFactory<TRedisSMQEvent>.constructor`

## Properties

### init()

> **init**: (`cb`) => `void`

#### Parameters

##### cb

`ICallback`\<`void`\>

#### Returns

`void`

#### Inherited from

`EventBusRedisFactory.init`

***

### shutdown()

> **shutdown**: (`cb`) => `void`

#### Parameters

##### cb

`ICallback`\<`void`\>

#### Returns

`void`

#### Inherited from

`EventBusRedisFactory.shutdown`

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

...`Parameters`\<`Pick`\<`TRedisClientEvent`, `"error"`\>\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

`EventBusRedisFactory.emit`

***

### getInstance()

> **getInstance**(): `Error` \| `IEventBus`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

#### Returns

`Error` \| `IEventBus`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

#### Inherited from

`EventBusRedisFactory.getInstance`

***

### getSetInstance()

> **getSetInstance**(`cb`): `void`

#### Parameters

##### cb

`ICallback`\<`IEventBus`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>\>

#### Returns

`void`

#### Inherited from

`EventBusRedisFactory.getSetInstance`

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

`Pick`\<`TRedisClientEvent`, `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

`EventBusRedisFactory.on`

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

`Pick`\<`TRedisClientEvent`, `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

`EventBusRedisFactory.once`

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

`EventBusRedisFactory.removeAllListeners`

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

`Pick`\<`TRedisClientEvent`, `"error"`\>\[`E`\]

#### Returns

`this`

#### Inherited from

`EventBusRedisFactory.removeListener`
