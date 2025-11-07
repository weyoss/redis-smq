[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MapAsyncOperationReturnTypeToResult

# Type Alias: MapAsyncOperationReturnTypeToResult\<AsyncOperationList\>

> **MapAsyncOperationReturnTypeToResult**\<`AsyncOperationList`\> = `{ [K in keyof AsyncOperationList]: ExtractAsyncOperationReturnType<AsyncOperationList[K]> }`

Maps an array of operation types to an array of their result types

## Type Parameters

### AsyncOperationList

`AsyncOperationList` *extends* [`TAsyncOperationList`](TAsyncOperationList.md)

Array of async operations
