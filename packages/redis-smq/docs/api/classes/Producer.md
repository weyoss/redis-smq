[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Producer

# Class: Producer

The Producer class is responsible for producing messages, managing their
delivery to various queues, and ensuring that all components are ready
for operation.
The class provides methods for enqueuing messages, handling consumer groups,
and producing messages based on the message's exchange parameters.
Error handling is included throughout the methods, returning appropriate
error objects when necessary.

## Hierarchy

- `Runnable`\<[`TProducerEvent`](../README.md#tproducerevent)\>

  ↳ **`Producer`**

## Table of contents

### Constructors

- [constructor](Producer.md#constructor)

### Methods

- [emit](Producer.md#emit)
- [getId](Producer.md#getid)
- [isDown](Producer.md#isdown)
- [isGoingDown](Producer.md#isgoingdown)
- [isGoingUp](Producer.md#isgoingup)
- [isRunning](Producer.md#isrunning)
- [isUp](Producer.md#isup)
- [on](Producer.md#on)
- [once](Producer.md#once)
- [produce](Producer.md#produce)
- [removeAllListeners](Producer.md#removealllisteners)
- [removeListener](Producer.md#removelistener)
- [run](Producer.md#run)
- [shutdown](Producer.md#shutdown)

## Constructors

### constructor

• **new Producer**(): [`Producer`](Producer.md)

Constructor for the Producer class. Initializes the Redis client,
event bus, and logger. Sets up the event bus publisher if enabled.

#### Returns

[`Producer`](Producer.md)

#### Overrides

Runnable\<TProducerEvent\>.constructor

## Methods

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<[`TProducerEvent`](../README.md#tproducerevent)[`E`]\> |

#### Returns

`boolean`

#### Inherited from

Runnable.emit

___

### getId

▸ **getId**(): `string`

#### Returns

`string`

#### Inherited from

Runnable.getId

___

### isDown

▸ **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isDown

___

### isGoingDown

▸ **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isGoingDown

___

### isGoingUp

▸ **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isGoingUp

___

### isRunning

▸ **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isRunning

___

### isUp

▸ **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Runnable.isUp

___

### on

▸ **on**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TProducerEvent`](../README.md#tproducerevent)[`E`] |

#### Returns

`this`

#### Inherited from

Runnable.on

___

### once

▸ **once**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TProducerEvent`](../README.md#tproducerevent)[`E`] |

#### Returns

`this`

#### Inherited from

Runnable.once

___

### produce

▸ **produce**(`msg`, `cb`): `void`

Produces a message based on the provided parameters. Ensures that a valid
exchange is set and that at least one matching queue exists before
publishing the message.

This method handles various errors, including:
- ProducerInstanceNotRunningError: Thrown when the producer instance is not running.
- ProducerMessageExchangeRequiredError: Thrown when no exchange is set for the message.
- ProducerExchangeNoMatchedQueueError: Thrown when no matching queues are found for the exchange.
- ProducerQueueNotFoundError: Thrown when a queue is not found.
- ProducerMessagePriorityRequiredError: Thrown when a message priority is required.
- ProducerPriorityQueuingNotEnabledError: Thrown when priority queuing is not enabled.
- ProducerUnknownQueueTypeError: Thrown when an unknown queue type is encountered.
- ProducerError: A generic error thrown when an unexpected error occurs.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `msg` | [`ProducibleMessage`](ProducibleMessage.md) | The message to be produced and published. |
| `cb` | `ICallback`\<`string`[]\> | A callback function to be executed upon completion. It receives an error as the first argument (if any) and an array of message IDs as the second argument. |

#### Returns

`void`

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

`this`

#### Inherited from

Runnable.removeAllListeners

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TProducerEvent`](../README.md#tproducerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TProducerEvent`](../README.md#tproducerevent)[`E`] |

#### Returns

`this`

#### Inherited from

Runnable.removeListener

___

### run

▸ **run**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`boolean`\> |

#### Returns

`void`

#### Inherited from

Runnable.run

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Inherited from

Runnable.shutdown
