[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TUnacknowledgementResolution

# Type Alias: TUnacknowledgementResolution

> **TUnacknowledgementResolution** = \{ `action`: [`REQUEUE`](../enumerations/EMessageUnacknowledgementAction.md#requeue) \| [`DELAY`](../enumerations/EMessageUnacknowledgementAction.md#delay); `cause`: [`EMessageUnacknowledgementCause`](../enumerations/EMessageUnacknowledgementCause.md); \} \| \{ `action`: [`DEAD_LETTER`](../enumerations/EMessageUnacknowledgementAction.md#dead_letter); `cause`: [`EMessageUnacknowledgementCause`](../enumerations/EMessageUnacknowledgementCause.md); `deadLetterCause`: [`EMessageDeadLetterCause`](../enumerations/EMessageDeadLetterCause.md); \}
