[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageAuditParsedConfig

# Interface: IMessageAuditParsedConfig

Fully-resolved message audit configuration.

This is what `IConfigManager.getConfig().messageAudit` returns and
what every internal component reads. Every category is present, every
union has been narrowed to its object form, and every numeric field
has a value.

The three fields are always present. A category the user disabled (or
omitted) appears with `enabled: false` and its other fields at their
defaults. A category the user enabled with the shorthand `true`
appears with `enabled: true` and every other field at its default.

The shape is stable across both raw forms — `true` and an object — so
internal code that reads `cfg.messageAudit.acknowledgedMessages.enabled`
does not need to branch on which form the user supplied.

## Properties

### acknowledgedMessages

> **acknowledgedMessages**: [`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)

Resolved configuration for the acknowledged-messages category.

---

### deadLetteredMessages

> **deadLetteredMessages**: [`IMessageAuditMessagesConfig`](IMessageAuditMessagesConfig.md)

Resolved configuration for the dead-lettered-messages category.

---

### unacknowledgementHistory

> **unacknowledgementHistory**: [`IMessageAuditHistoryConfig`](IMessageAuditHistoryConfig.md)

Resolved configuration for the unacknowledgement-history category.
