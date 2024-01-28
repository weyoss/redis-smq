[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerError

# Class: ConsumerError

## Hierarchy

- `RedisSMQError`

  ↳ **`ConsumerError`**

  ↳↳ [`ConsumerMessageHandlerAlreadyExistsError`](ConsumerMessageHandlerAlreadyExistsError.md)

  ↳↳ [`ConsumerGroupDeleteError`](ConsumerGroupDeleteError.md)

  ↳↳ [`ConsumerGroupIdNotFoundError`](ConsumerGroupIdNotFoundError.md)

  ↳↳ [`ConsumerGroupIdNotSupportedError`](ConsumerGroupIdNotSupportedError.md)

  ↳↳ [`ConsumerGroupIdRequiredError`](ConsumerGroupIdRequiredError.md)

  ↳↳ [`ConsumerInvalidGroupIdError`](ConsumerInvalidGroupIdError.md)

  ↳↳ [`ConsumerMessageHandlerError`](ConsumerMessageHandlerError.md)

## Table of contents

### Constructors

- [constructor](ConsumerError.md#constructor)

## Constructors

### constructor

• **new ConsumerError**(`message?`): [`ConsumerError`](ConsumerError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ConsumerError`](ConsumerError.md)

#### Inherited from

RedisSMQError.constructor
