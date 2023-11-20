>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisSMQConfigRequired

# Interface: IRedisSMQConfigRequired

## Contents

- [Properties](IRedisSMQConfigRequired.md#properties)
  - [eventListeners](IRedisSMQConfigRequired.md#eventlisteners)
  - [logger](IRedisSMQConfigRequired.md#logger)
  - [messages](IRedisSMQConfigRequired.md#messages)
  - [namespace](IRedisSMQConfigRequired.md#namespace)
  - [redis](IRedisSMQConfigRequired.md#redis)

## Properties

### eventListeners

> **eventListeners**: `Required`<[`IEventListenersConfig`](IEventListenersConfig.md)>

#### Overrides

Required.eventListeners

***

### logger

> **logger**: `ILoggerConfig`

### messages

> **messages**: `object`

#### Type declaration

##### store

> **store**: [`IMessagesConfigStorageRequired`](IMessagesConfigStorageRequired.md)

#### Overrides

Required.messages

***

### namespace

> **namespace**: `string`

### redis

> **redis**: `IRedisConfig`

