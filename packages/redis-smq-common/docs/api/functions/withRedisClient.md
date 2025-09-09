[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / withRedisClient

# Function: withRedisClient()

> **withRedisClient**\<`T`\>(`redisClient`, `operation`, `callback`): `void`

Executes a Redis operation with standardized error handling

This helper method centralizes the common pattern of:
1. Getting a Redis client instance
2. Checking for client errors
3. Checking for empty client replies
4. Executing the Redis operation with proper error handling

## Type Parameters

### T

`T`

## Parameters

### redisClient

[`RedisClientFactory`](../classes/RedisClientFactory.md)

Redis client to use for the operation

### operation

(`client`, `cb`) => `void`

Function that performs the actual Redis operation

### callback

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

The original callback to invoke with results

## Returns

`void`

## Typeparam

T - The type of data returned by the operation
