[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ComponentRegistry

# Class: ComponentRegistry

## Constructors

### Constructor

> **new ComponentRegistry**(): `ComponentRegistry`

#### Returns

`ComponentRegistry`

## Accessors

### size

#### Get Signature

> **get** `static` **size**(): `number`

Get the number of currently tracked components

##### Returns

`number`

## Methods

### clear()

> `static` **clear**(): `void`

Clear all tracking and waiters
Used during reset/shutdown

#### Returns

`void`

---

### has()

> `static` **has**(`component`): `boolean`

Check if a specific component is being tracked

#### Parameters

##### component

`Disposable`

#### Returns

`boolean`

---

### shutdownComponents()

> `static` **shutdownComponents**(`cb`): `void`

Gracefully shutdown all tracked components
This is called during RedisSMQ shutdown

#### Parameters

##### cb

`ICallback`

#### Returns

`void`

---

### track()

> `static` **track**\<`T`\>(`instance`): `T`

Track a component that has a shutdown method
This should be called by factories when creating new instances

#### Type Parameters

##### T

`T` _extends_ `object`

#### Parameters

##### instance

`T`

#### Returns

`T`

---

### untrack()

> `static` **untrack**(`component`): `boolean`

Remove a component from tracking
Useful for manual cleanup

#### Parameters

##### component

`Disposable`

#### Returns

`boolean`
