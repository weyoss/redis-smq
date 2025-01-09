[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Namespace

# Class: Namespace

## Table of contents

### Constructors

- [constructor](Namespace.md#constructor)

### Methods

- [delete](Namespace.md#delete)
- [getNamespaceQueues](Namespace.md#getnamespacequeues)
- [getNamespaces](Namespace.md#getnamespaces)
- [shutdown](Namespace.md#shutdown)

## Constructors

### constructor

• **new Namespace**()

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

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
