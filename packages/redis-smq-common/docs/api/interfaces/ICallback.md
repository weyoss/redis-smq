[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ICallback

# Interface: ICallback()\<TResult\>

Standard Node.js-style callback interface

## Type Parameters

### TResult

`TResult` = `void`

The type of the successful result

## Call Signature

> **ICallback**(`err?`, `result?`): `void`

### Parameters

#### err?

Error object if operation failed, null/undefined if successful

`null` | `Error`

#### result?

`TResult`

Result data if operation was successful

### Returns

`void`

## Call Signature

> **ICallback**(`err`, `result`): `void`

Overload for successful case with explicit null/undefined error

### Parameters

#### err

Must be null or undefined to indicate success

`undefined` | `null`

#### result

`TResult`

Result data from the successful operation

### Returns

`void`
