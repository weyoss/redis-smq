[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Namespace

# Class: Namespace

## Contents

- [Constructors](Namespace.md#constructors)
  - [new Namespace()](Namespace.md#new-namespace)
- [Methods](Namespace.md#methods)
  - [delete()](Namespace.md#delete)
  - [getNamespaceQueues()](Namespace.md#getnamespacequeues)
  - [getNamespaces()](Namespace.md#getnamespaces)

## Constructors

### new Namespace()

> **new Namespace**(): [`Namespace`](Namespace.md)

#### Returns

[`Namespace`](Namespace.md)

## Methods

### delete()

> **delete**(`namespace`, `cb`): `void`

#### Parameters

▪ **namespace**: `string`

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### getNamespaceQueues()

> **getNamespaceQueues**(`namespace`, `cb`): `void`

#### Parameters

▪ **namespace**: `string`

▪ **cb**: `ICallback`<[`IQueueParams`](../interfaces/IQueueParams.md)[]>

#### Returns

`void`

***

### getNamespaces()

> **getNamespaces**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<`string`[]>

#### Returns

`void`

