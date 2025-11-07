[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageAuditParsedConfig

# Interface: IMessageAuditParsedConfig

Parsed and normalized message audit configuration.

This interface represents the internal configuration after parsing user input,
applying defaults, and normalizing all values. Both acknowledged and dead-lettered
message configurations are always present with explicit enabled/disabled state.

## Properties

### acknowledgedMessages

> **acknowledgedMessages**: [`IMessageAuditParsedConfigOptions`](IMessageAuditParsedConfigOptions.md)

Parsed configuration for acknowledged message audit.

Contains the normalized settings including whether audit is enabled
and the effective queueSize and expire values (0 = unlimited).

***

### deadLetteredMessages

> **deadLetteredMessages**: [`IMessageAuditParsedConfigOptions`](IMessageAuditParsedConfigOptions.md)

Parsed configuration for dead-lettered message audit.

Contains the normalized settings including whether audit is enabled
and the effective queueSize and expire values (0 = unlimited).
