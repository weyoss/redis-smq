[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQConfigRequired

# Interface: IRedisSMQConfigRequired

## Hierarchy

- `Required`\<[`IRedisSMQConfig`](IRedisSMQConfig.md)\>

  ↳ **`IRedisSMQConfigRequired`**

## Table of contents

### Properties

- [eventBus](IRedisSMQConfigRequired.md#eventbus)
- [logger](IRedisSMQConfigRequired.md#logger)
- [messages](IRedisSMQConfigRequired.md#messages)
- [namespace](IRedisSMQConfigRequired.md#namespace)
- [redis](IRedisSMQConfigRequired.md#redis)

## Properties

### eventBus

• **eventBus**: `Required`\<[`IEventBusConfig`](IEventBusConfig.md)\>

#### Overrides

Required.eventBus

___

### logger

• **logger**: `ILoggerConfig`

**`See`**

https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md

#### Inherited from

Required.logger

___

### messages

• **messages**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `store` | [`IMessagesConfigStorageRequired`](IMessagesConfigStorageRequired.md) |

#### Overrides

Required.messages

___

### namespace

• **namespace**: `string`

#### Inherited from

Required.namespace

___

### redis

• **redis**: `IRedisConfig`

**`See`**

https://github.com/weyoss/redis-smq-common/blob/master/packages/redis-smq/docs/api/README.md#iredisconfig

#### Inherited from

Required.redis
