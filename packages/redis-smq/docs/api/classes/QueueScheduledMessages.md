[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueScheduledMessages

# Class: QueueScheduledMessages

## Extends

- `QueueExplorer`

## Constructors

### Constructor

> **new QueueScheduledMessages**(): `QueueScheduledMessages`

#### Returns

`QueueScheduledMessages`

#### Overrides

`QueueExplorer.constructor`

## Methods

### countMessages()

> **countMessages**(`queue`, `cb`): `void`

Counts the total number of messages in the queue.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters

##### cb

`ICallback`\<`number`\>

Callback returning the count

#### Returns

`void`

#### Inherited from

`QueueExplorer.countMessages`

***

### getMessages()

> **getMessages**(`queue`, `page`, `pageSize`, `cb`): `void`

Retrieves detailed messages for a specific page.

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

Extended queue parameters

##### page

`number`

Page number

##### pageSize

`number`

Number of items per page

##### cb

`ICallback`\<[`IPaginationPage`](../interfaces/IPaginationPage.md)\<[
`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

Callback returning an IQueueMessagesPage of IMessageTransferable

#### Returns

`void`

#### Inherited from

`QueueExplorer.getMessages`

***

### purge()

> **purge**(`queue`, `cb`): `void`

Purges all messages from the specified queue.

Different message types can be purged using specific classes:

- [QueueMessages](QueueMessages.md) - Delete all queue messages
- [QueueAcknowledgedMessages](QueueAcknowledgedMessages.md) - Delete acknowledged messages (if configured to be stored)
- [QueueDeadLetteredMessages](QueueDeadLetteredMessages.md) - Delete dead-lettered messages (if configured to be stored)
- QueueScheduledMessages - Delete scheduled messages
- [QueuePendingMessages](QueuePendingMessages.md) - Delete pending messages

#### Parameters

##### queue

[`TQueueExtendedParams`](../type-aliases/TQueueExtendedParams.md)

The queue to purge. Can be a string, queue parameters object,
or queue consumer group parameters.

##### cb

`ICallback`

Callback function that will be invoked when the operation completes.
If an error occurs, the first parameter will contain the Error object.
Otherwise, the first parameter will be null/undefined.

#### Returns

`void`

#### Inherited from

`QueueExplorer.purge`
