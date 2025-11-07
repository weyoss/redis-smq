[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TAsyncFunction

# Type Alias: TAsyncFunction\<TArgs, TResult\>

> **TAsyncFunction**\<`TArgs`, `TResult`\> = \[`TArgs`, [`ICallback`](../interfaces/ICallback.md)\<`TResult`\>\]

Represents a tuple where the last element is a callback function

## Type Parameters

### TArgs

`TArgs` *extends* `any`[] = \[\]

The types of the arguments in the tuple (excluding the callback)

### TResult

`TResult` = `any`

The type of result passed to the callback
