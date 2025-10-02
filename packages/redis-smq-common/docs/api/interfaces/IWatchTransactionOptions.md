[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IWatchTransactionOptions

# Interface: IWatchTransactionOptions

## Properties

### backoff()?

> `optional` **backoff**: (`attemptNo`) => `undefined` \| `number`

Optional backoff strategy in milliseconds. Return a number to delay before retrying.
Return undefined or <= 0 for no delay.

#### Parameters

##### attemptNo

`number`

#### Returns

`undefined` \| `number`

***

### makeRetryExceededError()?

> `optional` **makeRetryExceededError**: () => `Error`

Optional factory to create a domain-specific error when retries are exhausted.

#### Returns

`Error`

***

### maxAttempts?

> `optional` **maxAttempts**: `number`

Maximum number of attempts (including the first one). Default: 5

***

### onExecError()?

> `optional` **onExecError**: (`err`) => `void`

Optional hook invoked when EXEC fails with an error (not null abort).

#### Parameters

##### err

`Error`

#### Returns

`void`

***

### onRetry()?

> `optional` **onRetry**: (`attemptNo`, `maxAttempts`) => `void`

Optional hook invoked on each retry before scheduling the next attempt.

#### Parameters

##### attemptNo

`number`

##### maxAttempts

`number`

#### Returns

`void`

***

### onWatchError()?

> `optional` **onWatchError**: (`err`) => `void`

Optional hook invoked when WATCH returns an error.

#### Parameters

##### err

`Error`

#### Returns

`void`
