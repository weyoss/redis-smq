[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessages

# Class: QueueMessages

QueueMessages class manages message counting and state reporting across queue types.
It orchestrates various message handlers (pending, acknowledged, scheduled, dead-lettered)
and leverages a waterfall pattern for processing.

## Extends

- `MessageBrowserAbstract`

## Constructors

### Constructor

> **new QueueMessages**(): `QueueMessages`

#### Returns

`QueueMessages`

#### Overrides

`MessageBrowserAbstract.constructor`

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

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Inherited from

`MessageBrowserAbstract.countMessages`

---

### countMessagesByStatus()

> **countMessagesByStatus**(`queue`, `cb`): `void`

Count messages broken down by status: pending, acknowledged, scheduled, and dead-lettered.

#### Parameters

##### queue

Queue string name or parameters.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<[`IQueueMessagesCount`](../interfaces/IQueueMessagesCount.md)\>

Callback function returning the IQueueMessagesCount.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

---

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

`ICallback`\<[`IBrowserPage`](../interfaces/IBrowserPage.md)\<[`IMessageTransferable`](../interfaces/IMessageTransferable.md)\<`unknown`\>\>\>

Callback returning an IQueueMessagesPage of IMessageTransferable

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Inherited from

`MessageBrowserAbstract.getMessages`

---

### purge()

> **purge**(`queue`, `cb`): `void`

Purges all messages from the specified queue.

Different message types can be purged using specific classes:

- QueueMessages - Delete all queue messages
- [QueueAcknowledgedMessages](QueueAcknowledgedMessages.md) - Delete acknowledged messages (if configured to be stored)
- [QueueDeadLetteredMessages](QueueDeadLetteredMessages.md) - Delete dead-lettered messages (if configured to be stored)
- [QueueScheduledMessages](QueueScheduledMessages.md) - Delete scheduled messages
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

#### Throws

InvalidQueueParametersError

#### Throws

ConsumerGroupRequiredError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueNotFoundError

#### Inherited from

`MessageBrowserAbstract.purge`
