[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IWorkerCallable

# Interface: IWorkerCallable\<Payload, Reply\>

## Type parameters

| Name |
| :------ |
| `Payload` |
| `Reply` |

## Implemented by

- [`WorkerCallable`](../classes/WorkerCallable.md)

## Table of contents

### Methods

- [call](IWorkerCallable.md#call)

## Methods

### call

▸ **call**(`args`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Payload` |
| `cb` | [`ICallback`](ICallback.md)\<`Reply`\> |

#### Returns

`void`
