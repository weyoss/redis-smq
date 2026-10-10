[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TMessageUnacknowledgementHistory

# Type Alias: TMessageUnacknowledgementHistory

> **TMessageUnacknowledgementHistory** = [`IMessageUnacknowledgementRecord`](../interfaces/IMessageUnacknowledgementRecord.md)[]

The full unacknowledgement history of a message.

The order of records is newest first — the underlying Redis list is
built with `LPUSH`, so index 0 is the most recent entry. Callers that
want chronological order reverse the array.

An empty array means the message has never been unacknowledged.
`IMessageManager.getMessageUnacknowledgementHistory` returns an empty
array in that case rather than an error.

The list is capped by `IMessageAuditHistoryConfig.maxSize`. When the
cap is reached, the oldest entry is trimmed on every new append.
