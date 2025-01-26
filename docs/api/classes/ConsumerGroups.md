[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroups

# Class: ConsumerGroups

## Table of contents

### Constructors

- [constructor](ConsumerGroups.md#constructor)

### Methods

- [deleteConsumerGroup](ConsumerGroups.md#deleteconsumergroup)
- [getConsumerGroups](ConsumerGroups.md#getconsumergroups)
- [saveConsumerGroup](ConsumerGroups.md#saveconsumergroup)
- [shutdown](ConsumerGroups.md#shutdown)

## Constructors

### constructor

• **new ConsumerGroups**(): [`ConsumerGroups`](ConsumerGroups.md)

#### Returns

[`ConsumerGroups`](ConsumerGroups.md)

## Methods

### deleteConsumerGroup

▸ **deleteConsumerGroup**(`queue`, `groupId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `groupId` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### getConsumerGroups

▸ **getConsumerGroups**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`string`[]\> |

#### Returns

`void`

___

### saveConsumerGroup

▸ **saveConsumerGroup**(`queue`, `groupId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `groupId` | `string` |
| `cb` | `ICallback`\<`number`\> |

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
