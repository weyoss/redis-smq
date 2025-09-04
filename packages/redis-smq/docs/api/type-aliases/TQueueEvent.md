[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TQueueEvent

# Type Alias: TQueueEvent

> **TQueueEvent** = `object`

## Properties

### queue.consumerGroupCreated()

> **queue.consumerGroupCreated**: (`queue`, `groupId`) => `void`

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

##### groupId

`string`

#### Returns

`void`

***

### queue.consumerGroupDeleted()

> **queue.consumerGroupDeleted**: (`queue`, `groupId`) => `void`

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

##### groupId

`string`

#### Returns

`void`

***

### queue.queueCreated()

> **queue.queueCreated**: (`queue`, `properties`) => `void`

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

##### properties

[`IQueueProperties`](../interfaces/IQueueProperties.md)

#### Returns

`void`

***

### queue.queueDeleted()

> **queue.queueDeleted**: (`queue`) => `void`

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

`void`
