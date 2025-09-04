[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TMessageUnacknowledgementAction

# Type Alias: TMessageUnacknowledgementAction

> **TMessageUnacknowledgementAction** = \{ `action`: [`REQUEUE`](../enumerations/EMessageUnacknowledgementAction.md#requeue) \| [`DELAY`](../enumerations/EMessageUnacknowledgementAction.md#delay); \} \| \{ `action`: [`DEAD_LETTER`](../enumerations/EMessageUnacknowledgementAction.md#dead_letter); `deadLetterReason`: [`EMessageUnacknowledgementDeadLetterReason`](../enumerations/EMessageUnacknowledgementDeadLetterReason.md); \}
