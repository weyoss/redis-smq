[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ICallback

# Interface: ICallback\<TResult\>

Standard Node.js-style callback interface

## Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `TResult` | `void` | The type of the successful result |

## Callable

### ICallback

▸ **ICallback**(`err?`, `result?`): `void`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `err?` | ``null`` \| `Error` | Error object if operation failed, null/undefined if successful |
| `result?` | `TResult` | Result data if operation was successful |

#### Returns

`void`

### ICallback

▸ **ICallback**(`err`, `result`): `void`

Overload for successful case with explicit null/undefined error

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `err` | `undefined` \| ``null`` | Must be null or undefined to indicate success |
| `result` | `TResult` | Result data from the successful operation |

#### Returns

`void`
