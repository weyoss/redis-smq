[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventEmitter

# Class: EventEmitter\<Events\>

## Extended by

- [`EventBus`](EventBus.md)
- [`EventBusRedis`](EventBusRedis.md)
- [`EventBusRedisFactory`](EventBusRedisFactory.md)
- [`IRedisClient`](../interfaces/IRedisClient.md)
- [`RedisClientFactory`](RedisClientFactory.md)
- [`Runnable`](Runnable.md)
- [`Timer`](Timer.md)

## Type Parameters

### Events

`Events` *extends* [`TEventEmitterEvent`](../type-aliases/TEventEmitterEvent.md)

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<`Events`\>

## Constructors

### Constructor

> **new EventEmitter**\<`Events`\>(): `EventEmitter`\<`Events`\>

#### Returns

`EventEmitter`\<`Events`\>

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### args

...`Parameters`\<`Events`\[`E`\]\>

#### Returns

`boolean`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Events`\[`E`\]

#### Returns

`this`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`on`](../interfaces/IEventEmitter.md#on)

***

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Events`\[`E`\]

#### Returns

`this`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`once`](../interfaces/IEventEmitter.md#once)

***

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`removeAllListeners`](../interfaces/IEventEmitter.md#removealllisteners)

***

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Events`\[`E`\]

#### Returns

`this`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`removeListener`](../interfaces/IEventEmitter.md#removelistener)
