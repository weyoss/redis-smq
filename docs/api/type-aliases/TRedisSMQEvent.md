> [RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TRedisSMQEvent

# Type alias: TRedisSMQEvent

## Hierarchy

- [`TEvent`](https://github.com/weyoss/redis-smq-common/blob/master/docs/api/README.md#tevent)

  ↳ `TRedisSMQEvent`.

## Description

| Event Name              | Arguments                                                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heartbeatTick`         | (`timestamp`: `number`, `consumerId`: `string`, `heartbeatPayload`: [`IConsumerHeartbeat`](../interfaces/IConsumerHeartbeat.md)) => `void` ;                                                                                                                |
| `messageAcknowledged`   | (`messageId`: `string`, `queue`: [`IQueueParams`](../interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                                         |
| `messageDeadLettered`   | (`cause`: [`EConsumeMessageDeadLetterCause`](../enumerations/EConsumeMessageDeadLetterCause.md), `messageId`: `string`, `queue`: [`IQueueParams`](../interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;         |
| `messageDelayed`        | (`messageId`: `string`, `queue`: [`IQueueParams`](../interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                                         |
| `messagePublished`      | (`messageId`: `string`, `queue`: [`IQueueParams`](../interfaces/IQueueParams.md)) => `void` ;                                                                                                                                                               |
| `messageReceived`       | (`messageId`: `string`, `queue`: [`IQueueParams`](../interfaces/IQueueParams.md), `consumerId`: `string`) => `void` ;                                                                                                                                       |
| `messageRequeued`       | (`messageId`: `string`, `queue`: [`IQueueParams`](../interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                                         |
| `messageUnacknowledged` | (`cause`: [`EConsumeMessageUnacknowledgedCause`](../enumerations/EConsumeMessageUnacknowledgedCause.md), `messageId`: `string`, `queue`: [`IQueueParams`](../interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ; |
