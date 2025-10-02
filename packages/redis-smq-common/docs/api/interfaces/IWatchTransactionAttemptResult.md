[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IWatchTransactionAttemptResult

# Interface: IWatchTransactionAttemptResult

## Properties

### afterExec()?

> `optional` **afterExec**: (`execResult`) => `void`

Optional post-success hook. Called after a successful EXEC (non-null result).

#### Parameters

##### execResult

`unknown`[]

#### Returns

`void`

***

### multi

> **multi**: [`IRedisTransaction`](IRedisTransaction.md)

Prepared MULTI to be executed atomically. Helper will call exec() on it.
