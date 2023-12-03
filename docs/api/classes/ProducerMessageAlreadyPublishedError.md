[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerMessageAlreadyPublishedError

# Class: ProducerMessageAlreadyPublishedError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerMessageAlreadyPublishedError`**

## Table of contents

### Constructors

- [constructor](ProducerMessageAlreadyPublishedError.md#constructor)

## Constructors

### constructor

• **new ProducerMessageAlreadyPublishedError**(`msg?`): [`ProducerMessageAlreadyPublishedError`](ProducerMessageAlreadyPublishedError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `msg` | `string` | `'The message can not published. Either you have already published the message or you have called the getSetMessageState() method.'` |

#### Returns

[`ProducerMessageAlreadyPublishedError`](ProducerMessageAlreadyPublishedError.md)

#### Overrides

[ProducerError](ProducerError.md).[constructor](ProducerError.md#constructor)
