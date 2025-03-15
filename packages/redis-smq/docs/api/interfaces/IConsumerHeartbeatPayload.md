[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IConsumerHeartbeatPayload

# Interface: IConsumerHeartbeatPayload

## Table of contents

### Properties

- [cpu](IConsumerHeartbeatPayload.md#cpu)
- [ram](IConsumerHeartbeatPayload.md#ram)

## Properties

### cpu

• **cpu**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `percentage` | `string` |
| `system` | `number` |
| `user` | `number` |

___

### ram

• **ram**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `free` | `number` |
| `total` | `number` |
| `usage` | `MemoryUsage` |
