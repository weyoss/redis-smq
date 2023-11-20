>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueRateLimit

# Class: QueueRateLimit

## Contents

- [Constructors](QueueRateLimit.md#constructors)
  - [new QueueRateLimit()](QueueRateLimit.md#new-queueratelimit)
- [Methods](QueueRateLimit.md#methods)
  - [clear()](QueueRateLimit.md#clear)
  - [get()](QueueRateLimit.md#get)
  - [hasExceeded()](QueueRateLimit.md#hasexceeded)
  - [set()](QueueRateLimit.md#set)
  - [hasExceeded()](QueueRateLimit.md#hasexceeded-1)

## Constructors

### new QueueRateLimit()

> **new QueueRateLimit**(): [`QueueRateLimit`](QueueRateLimit.md)

#### Returns

[`QueueRateLimit`](QueueRateLimit.md)

## Methods

### clear()

> **clear**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### get()

> **get**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`null` | [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)>

#### Returns

`void`

***

### hasExceeded()

> **hasExceeded**(`queue`, `rateLimit`, `cb`): `void`

#### Parameters

▪ **queue**: [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **rateLimit**: [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

▪ **cb**: `ICallback`<`boolean`>

#### Returns

`void`

***

### set()

> **set**(`queue`, `rateLimit`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **rateLimit**: [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### hasExceeded()

> **`static`** **hasExceeded**(`redisClient`, `queue`, `rateLimit`, `cb`): `void`

#### Parameters

▪ **redisClient**: `RedisClient`

▪ **queue**: [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **rateLimit**: [`IQueueRateLimit`](../interfaces/IQueueRateLimit.md)

▪ **cb**: `ICallback`<`boolean`>

#### Returns

`void`

