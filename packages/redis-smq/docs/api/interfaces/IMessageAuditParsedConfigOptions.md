[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageAuditParsedConfigOptions

# Interface: IMessageAuditParsedConfigOptions

Parsed and normalized message audit configuration options.

This interface represents the internal configuration after parsing user input
and applying default values.

## Properties

### enabled

> **enabled**: `boolean`

Whether message audit is enabled for this message type.

When true, dedicated storage is created to track message IDs.
When false, no audit storage is maintained.

***

### expire

> **expire**: `number`

Retention time for message IDs in seconds.

This value is always set after parsing, using either the user-provided
value or the default (0 = unlimited).

***

### queueSize

> **queueSize**: `number`

Maximum number of message IDs to store per queue.

This value is always set after parsing, using either the user-provided
value or the default (0 = unlimited).
