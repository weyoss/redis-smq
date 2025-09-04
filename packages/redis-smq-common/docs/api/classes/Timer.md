[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Timer

# Class: Timer

## Extends

- [`EventEmitter`](EventEmitter.md)\<[`TTimerEvent`](../type-aliases/TTimerEvent.md)\>

## Constructors

### Constructor

> **new Timer**(): `Timer`

#### Returns

`Timer`

#### Inherited from

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

...`Parameters`\<[`TTimerEvent`](../type-aliases/TTimerEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

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

[`TTimerEvent`](../type-aliases/TTimerEvent.md)\[`E`\]

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

[`TTimerEvent`](../type-aliases/TTimerEvent.md)\[`E`\]

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

[`TTimerEvent`](../type-aliases/TTimerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeListener`](EventEmitter.md#removelistener)

***

### reset()

> **reset**(): `void`

#### Returns

`void`

***

### setInterval()

> **setInterval**(`fn`, `interval`): `boolean`

#### Parameters

##### fn

[`TFunction`](../type-aliases/TFunction.md)

##### interval

`number` = `1000`

#### Returns

`boolean`

***

### setTimeout()

> **setTimeout**(`fn`, `timeout`): `boolean`

#### Parameters

##### fn

[`TFunction`](../type-aliases/TFunction.md)

##### timeout

`number`

#### Returns

`boolean`
