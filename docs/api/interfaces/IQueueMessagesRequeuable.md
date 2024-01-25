[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IQueueMessagesRequeuable

# Interface: IQueueMessagesRequeuable

## Implemented by

- [`QueueAcknowledgedMessages`](../classes/QueueAcknowledgedMessages.md)
- [`QueueDeadLetteredMessages`](../classes/QueueDeadLetteredMessages.md)

## Table of contents

### Methods

- [requeueMessage](IQueueMessagesRequeuable.md#requeuemessage)

## Methods

### requeueMessage

▸ **requeueMessage**(`queue`, `messageId`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](IQueueParams.md) |
| `messageId` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
