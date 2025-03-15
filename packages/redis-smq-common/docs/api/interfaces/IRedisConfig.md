[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisConfig

# Interface: IRedisConfig

## Table of contents

### Properties

- [client](IRedisConfig.md#client)
- [options](IRedisConfig.md#options)

## Properties

### client

• **client**: [`ERedisConfigClient`](../enums/ERedisConfigClient.md)

Specifies which Redis client should be used.

___

### options

• `Optional` **options**: `Record`\<`string`, `unknown`\>

Optional property to provide configuration options specific to the
@redis/client or ioredis. Refer to the documentation for both clients for detailed options.

**`See`**

 - https://github.com/luin/ioredis/blob/master/API.md#new_Redis
 - https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
