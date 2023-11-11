[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Queue

# Class: Queue

## Contents

- [Constructors](Queue.md#constructors)
  - [new Queue()](Queue.md#new-queue)
- [Methods](Queue.md#methods)
  - [delete()](Queue.md#delete)
  - [exists()](Queue.md#exists)
  - [getProperties()](Queue.md#getproperties)
  - [getQueues()](Queue.md#getqueues)
  - [save()](Queue.md#save)

## Constructors

### new Queue()

> **new Queue**(): [`Queue`](Queue.md)

#### Returns

[`Queue`](Queue.md)

## Methods

### delete()

> **delete**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### exists()

> **exists**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`boolean`>

#### Returns

`void`

***

### getProperties()

> **getProperties**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<[`IQueueProperties`](../interfaces/IQueueProperties.md)>

#### Returns

`void`

***

### getQueues()

> **getQueues**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<[`IQueueParams`](../interfaces/IQueueParams.md)[]>

#### Returns

`void`

***

### save()

> **save**(`queue`, `queueType`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **queueType**: [`EQueueType`](../enumerations/EQueueType.md)

▪ **cb**: `ICallback`<`object`>

#### Returns

`void`

