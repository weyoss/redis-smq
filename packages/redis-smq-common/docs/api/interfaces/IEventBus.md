[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IEventBus

# Interface: IEventBus\<Events\>

## Extends

- [`IEventEmitter`](IEventEmitter.md)\<`Events`\>

## Type Parameters

### Events

`Events` *extends* [`TEventBusEvent`](../type-aliases/TEventBusEvent.md)

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

#### Inherited from

[`IEventEmitter`](IEventEmitter.md).[`emit`](IEventEmitter.md#emit)

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

#### Inherited from

[`IEventEmitter`](IEventEmitter.md).[`on`](IEventEmitter.md#on)

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

#### Inherited from

[`IEventEmitter`](IEventEmitter.md).[`once`](IEventEmitter.md#once)

***

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event?

`E`

#### Returns

`this`

#### Inherited from

[`IEventEmitter`](IEventEmitter.md).[`removeAllListeners`](IEventEmitter.md#removealllisteners)

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

#### Inherited from

[`IEventEmitter`](IEventEmitter.md).[`removeListener`](IEventEmitter.md#removelistener)

***

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`void`\>

#### Returns

`void`
