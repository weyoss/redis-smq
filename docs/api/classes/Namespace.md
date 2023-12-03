[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Namespace

# Class: Namespace

## Table of contents

### Constructors

- [constructor](Namespace.md#constructor)

### Methods

- [delete](Namespace.md#delete)
- [getNamespaceQueues](Namespace.md#getnamespacequeues)
- [getNamespaces](Namespace.md#getnamespaces)

## Constructors

### constructor

• **new Namespace**(): [`Namespace`](Namespace.md)

#### Returns

[`Namespace`](Namespace.md)

## Methods

### delete

▸ **delete**(`namespace`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### getNamespaceQueues

▸ **getNamespaceQueues**(`namespace`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `string` |
| `cb` | `ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\> |

#### Returns

`void`

___

### getNamespaces

▸ **getNamespaces**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`string`[]\> |

#### Returns

`void`
