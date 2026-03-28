[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditParsedConfig

# Interface: IMessageAuditParsedConfig

**`Internal`**

Parsed and normalized configuration interface.

This interface represents the final configuration after processing and
merging defaults. It contains fully resolved configuration objects for
each audit category, with all optional fields populated with their
default values.

This is an internal interface used by the system after configuration
validation and normalization.

## Properties

### acknowledgedMessages

> **acknowledgedMessages**: [`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)

Normalized configuration for acknowledged messages audit

---

### deadLetteredMessages

> **deadLetteredMessages**: [`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)

Normalized configuration for dead-lettered messages audit

---

### unacknowledgementHistory

> **unacknowledgementHistory**: [`IMessageAuditHistoryConfig`](IMessageAuditHistoryConfig.md)

Normalized configuration for unacknowledgement history
