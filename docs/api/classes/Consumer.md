[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

## Hierarchy

- `Runnable`\<[`TConsumerEvent`](../README.md#tconsumerevent)\>

  ↳ **`Consumer`**

## Table of contents

### Constructors

- [constructor](Consumer.md#constructor)

### Methods

- [cancel](Consumer.md#cancel)
- [consume](Consumer.md#consume)
- [emit](Consumer.md#emit)
- [getId](Consumer.md#getid)
- [getQueues](Consumer.md#getqueues)
- [isDown](Consumer.md#isdown)
- [isGoingDown](Consumer.md#isgoingdown)
- [isGoingUp](Consumer.md#isgoingup)
- [isRunning](Consumer.md#isrunning)
- [isUp](Consumer.md#isup)
- [on](Consumer.md#on)
- [once](Consumer.md#once)
- [removeAllListeners](Consumer.md#removealllisteners)
- [removeListener](Consumer.md#removelistener)
- [run](Consumer.md#run)
- [shutdown](Consumer.md#shutdown)

## Constructors

### constructor

• **new Consumer**(`enableMultiplexing?`): [`Consumer`](Consumer.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `enableMultiplexing?` | `boolean` |

#### Returns

[`Consumer`](Consumer.md)

#### Overrides

Runnable\<TConsumerEvent\>.constructor

## Methods

### cancel

▸ **cancel**(`queue`, `cb`): `void`

Cancel consuming messages from the provided queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) | Queue parameters |
| `cb` | `ICallback`\<`void`\> | A callback function |

#### Returns

`void`

___

### consume

▸ **consume**(`queue`, `messageHandler`, `cb`): `void`

Start listening for messages on the specified queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | [`TQueueExtendedParams`](../README.md#tqueueextendedparams) | A queue from which messages will be consumed. Before consuming messages from a queue make sure that the specified queue already exists in the system. |
| `messageHandler` | [`TConsumerMessageHandler`](../README.md#tconsumermessagehandler) | A callback function that defines how to process each message consumed from the queue. The messageHandler will receive the message as an argument and should implement the logic for processing the message. This might include business logic, transformation, storage, etc. It's crucial that this function handles exceptions and errors properly to avoid issues with message acknowledgment. |
| `cb` | `ICallback`\<`void`\> | The callback function will be executed after the consumption process is initiated. It typically signifies the end of the consumption setup and can be used to handle success or errors in starting the consumption process. |

#### Returns

`void`

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/consuming-messages.md

___

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<[`TConsumerEvent`](../README.md#tconsumerevent)[`E`]\> |

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

### getQueues

▸ **getQueues**(): [`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

Retrieve the list of queues being consumed by a Consumer instance.

#### Returns

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)[]

- Queue list

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
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TConsumerEvent`](../README.md#tconsumerevent)[`E`] |

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
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TConsumerEvent`](../README.md#tconsumerevent)[`E`] |

#### Returns

`this`

#### Inherited from

Runnable.once

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

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
| `E` | extends keyof [`TConsumerEvent`](../README.md#tconsumerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TConsumerEvent`](../README.md#tconsumerevent)[`E`] |

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
