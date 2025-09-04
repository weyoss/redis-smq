[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBus

# Class: EventBus\<Events\>

## Extends

- [`EventEmitter`](EventEmitter.md)\<`Events`\>

## Type Parameters

### Events

`Events` *extends* [`TEventBusEvent`](../type-aliases/TEventBusEvent.md)

## Implements

- [`IEventBus`](../interfaces/IEventBus.md)\<`Events`\>

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

[`IEventBus`](../interfaces/IEventBus.md).[`emit`](../interfaces/IEventBus.md#emit)

#### Overrides

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

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

[`IEventBus`](../interfaces/IEventBus.md).[`on`](../interfaces/IEventBus.md#on)

#### Overrides

[`EventEmitter`](EventEmitter.md).[`on`](EventEmitter.md#on)

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

[`IEventBus`](../interfaces/IEventBus.md).[`once`](../interfaces/IEventBus.md#once)

#### Overrides

[`EventEmitter`](EventEmitter.md).[`once`](EventEmitter.md#once)

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

[`IEventBus`](../interfaces/IEventBus.md).[`removeAllListeners`](../interfaces/IEventBus.md#removealllisteners)

#### Overrides

[`EventEmitter`](EventEmitter.md).[`removeAllListeners`](EventEmitter.md#removealllisteners)

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

[`IEventBus`](../interfaces/IEventBus.md).[`removeListener`](../interfaces/IEventBus.md#removelistener)

#### Overrides

[`EventEmitter`](EventEmitter.md).[`removeListener`](EventEmitter.md#removelistener)

***

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

#### Returns

`void`

#### Implementation of

[`IEventBus`](../interfaces/IEventBus.md).[`shutdown`](../interfaces/IEventBus.md#shutdown)

***

### createInstance()

> `static` **createInstance**\<`T`\>(`cb`): `void`

#### Type Parameters

##### T

`T` *extends* [`TEventBusEvent`](../type-aliases/TEventBusEvent.md)

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<[`IEventBus`](../interfaces/IEventBus.md)\<`T`\>\>

#### Returns

`void`
