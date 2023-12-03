[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerError

# Class: ProducerError

## Hierarchy

- `RedisSMQError`

  ↳ **`ProducerError`**

  ↳↳ [`ProducerMessageAlreadyPublishedError`](ProducerMessageAlreadyPublishedError.md)

  ↳↳ [`ProducerMessageNotPublishedError`](ProducerMessageNotPublishedError.md)

  ↳↳ [`ProducerMessageNotScheduledError`](ProducerMessageNotScheduledError.md)

  ↳↳ [`ProducerInstanceNotRunningError`](ProducerInstanceNotRunningError.md)

## Table of contents

### Constructors

- [constructor](ProducerError.md#constructor)

## Constructors

### constructor

• **new ProducerError**(`message?`): [`ProducerError`](ProducerError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ProducerError`](ProducerError.md)

#### Inherited from

RedisSMQError.constructor
