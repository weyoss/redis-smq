[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExtractAsyncOperationReturnType

# Type Alias: ExtractAsyncOperationReturnType\<T\>

> **ExtractAsyncOperationReturnType**\<`T`\> = `T` *extends* [`TAsyncOperation`](TAsyncOperation.md)\<infer R\> ? `R` : `never`

Helper type to extract the result type from a callback-based async operation

## Type Parameters

### T

`T` *extends* [`TAsyncOperation`](TAsyncOperation.md)\<`unknown`\>

The async operation type
