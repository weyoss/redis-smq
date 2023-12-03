[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Queue

# Class: Queue

## Table of contents

### Constructors

- [constructor](Queue.md#constructor)

### Methods

- [delete](Queue.md#delete)
- [exists](Queue.md#exists)
- [getProperties](Queue.md#getproperties)
- [getQueues](Queue.md#getqueues)
- [save](Queue.md#save)

## Constructors

### constructor

• **new Queue**(): [`Queue`](Queue.md)

#### Returns

[`Queue`](Queue.md)

## Methods

### delete

▸ **delete**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### exists

▸ **exists**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`boolean`\> |

#### Returns

`void`

___

### getProperties

▸ **getProperties**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\> |

#### Returns

`void`

___

### getQueues

▸ **getQueues**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\> |

#### Returns

`void`

___

### save

▸ **save**(`queue`, `queueType`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `queueType` | [`EQueueType`](../enums/EQueueType.md) |
| `cb` | `ICallback`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md) ; `queue`: [`IQueueParams`](../interfaces/IQueueParams.md)  }\> |

#### Returns

`void`
