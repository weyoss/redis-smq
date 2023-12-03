[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Consumer

# Class: Consumer

## Hierarchy

- `Base`

  ↳ **`Consumer`**

## Table of contents

### Constructors

- [constructor](Consumer.md#constructor)

### Methods

- [cancel](Consumer.md#cancel)
- [consume](Consumer.md#consume)
- [getId](Consumer.md#getid)
- [getQueues](Consumer.md#getqueues)
- [handleError](Consumer.md#handleerror)
- [isDown](Consumer.md#isdown)
- [isGoingDown](Consumer.md#isgoingdown)
- [isGoingUp](Consumer.md#isgoingup)
- [isRunning](Consumer.md#isrunning)
- [isUp](Consumer.md#isup)
- [run](Consumer.md#run)
- [shutdown](Consumer.md#shutdown)

## Constructors

### constructor

• **new Consumer**(`useMultiplexing?`): [`Consumer`](Consumer.md)

#### Parameters


| Name              | Type      | Default value |
| :------------------ | :---------- | :-------------- |
| `useMultiplexing` | `boolean` | `false`       |

#### Returns

[`Consumer`](Consumer.md)

#### Overrides

Base.constructor

## Methods

### cancel

▸ **cancel**(`queue`, `cb`): `void`

#### Parameters


| Name    | Type                                                        |
| :-------- | :------------------------------------------------------------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb`    | `ICallback`\<`void`\>                                       |

#### Returns

`void`

---

### consume

▸ **consume**(`queue`, `messageHandler`, `cb`): `void`

#### Parameters


| Name             | Type                                                              |
| :----------------- | :------------------------------------------------------------------ |
| `queue`          | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md)       |
| `messageHandler` | [`TConsumerMessageHandler`](../README.md#tconsumermessagehandler) |
| `cb`             | `ICallback`\<`void`\>                                             |

#### Returns

`void`

---

### getId

▸ **getId**(): `string`

#### Returns

`string`

#### Inherited from

Base.getId

---

### getQueues

▸ **getQueues**(): [`IQueueParams`](../interfaces/IQueueParams.md)[]

#### Returns

[`IQueueParams`](../interfaces/IQueueParams.md)[]

---

### handleError

▸ **handleError**(`err`): `void`

#### Parameters


| Name  | Type    |
| :------ | :-------- |
| `err` | `Error` |

#### Returns

`void`

#### Inherited from

Base.handleError

---

### isDown

▸ **isDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isDown

---

### isGoingDown

▸ **isGoingDown**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isGoingDown

---

### isGoingUp

▸ **isGoingUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isGoingUp

---

### isRunning

▸ **isRunning**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isRunning

---

### isUp

▸ **isUp**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Base.isUp

---

### run

▸ **run**(`cb?`): `void`

#### Parameters


| Name  | Type                     |
| :------ | :------------------------- |
| `cb?` | `ICallback`\<`boolean`\> |

#### Returns

`void`

#### Inherited from

Base.run

---

### shutdown

▸ **shutdown**(`cb?`): `void`

#### Parameters


| Name  | Type                     |
| :------ | :------------------------- |
| `cb?` | `ICallback`\<`boolean`\> |

#### Returns

`void`

#### Inherited from

Base.shutdown
