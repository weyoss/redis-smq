[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / withWatchTransaction

# Function: withWatchTransaction()

> **withWatchTransaction**(`client`, `attemptFn`, `callback`, `options?`): `void`

Runs a WATCH/MULTI/EXEC attempt with automatic retry on concurrent modification.
The provided attemptFn must:
 - Call api.watch(...) before performing any reads that inform writes.
 - Perform the necessary reads and validations.
 - Build and return a MULTI with the intended writes.

Helper guarantees:
 - client.unwatch() is called on any attempt error or aborted EXEC before retrying or returning.
 - Retries up to options.maxAttempts (default 3). If exhausted, returns options.makeRetryExceededError()
   if provided, otherwise a generic Error.

## Parameters

### client

[`IRedisClient`](../interfaces/IRedisClient.md)

### attemptFn

(`client`, `watch`, `cb`) => `void`

### callback

[`ICallback`](../interfaces/ICallback.md)\<`unknown`[]\>

### options?

[`IWatchTransactionOptions`](../interfaces/IWatchTransactionOptions.md)

## Returns

`void`
