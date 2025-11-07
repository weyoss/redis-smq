[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IEventEmitter

# Interface: IEventEmitter\<Events\>

## Type Parameters

### Events

`Events` *extends* [`TEventEmitterEvent`](../type-aliases/TEventEmitterEvent.md)

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
