[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueError

# Class: QueueError

## Hierarchy

- `RedisSMQError`

  ↳ **`QueueError`**

  ↳↳ [`QueueMessageNotFoundError`](QueueMessageNotFoundError.md)

  ↳↳ [`QueueMessageRequeueError`](QueueMessageRequeueError.md)

  ↳↳ [`QueueNamespaceNotFoundError`](QueueNamespaceNotFoundError.md)

  ↳↳ [`QueueExistsError`](QueueExistsError.md)

  ↳↳ [`QueueHasRunningConsumersError`](QueueHasRunningConsumersError.md)

  ↳↳ [`QueueNotEmptyError`](QueueNotEmptyError.md)

  ↳↳ [`QueueNotFoundError`](QueueNotFoundError.md)

  ↳↳ [`QueueRateLimitError`](QueueRateLimitError.md)

  ↳↳ [`QueueDeleteOperationError`](QueueDeleteOperationError.md)

## Table of contents

### Constructors

- [constructor](QueueError.md#constructor)

## Constructors

### constructor

• **new QueueError**(`message?`): [`QueueError`](QueueError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueError`](QueueError.md)

#### Inherited from

RedisSMQError.constructor
