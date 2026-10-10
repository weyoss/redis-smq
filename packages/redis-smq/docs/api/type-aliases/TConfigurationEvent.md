[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TConfigurationEvent

# Type Alias: TConfigurationEvent

> **TConfigurationEvent** = `object`

Configuration events.

Emitted when the runtime configuration changes. The event carries the
fully-parsed configuration and the new version number.

Only one event in this category today.

## Properties

### configuration.updated

> **configuration.updated**: (`config`, `version`) => `void`

The configuration was updated.

Fires in the process that performed the update, and in every other
process connected to the same Redis instance via the configuration
sync mechanism. A subscriber sees the event once per update per
process, after the version number has been incremented.

#### Parameters

##### config

[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

The new fully-parsed configuration.

##### version

`number`

The new version number. Monotonically increasing;
a subscriber can compare against the previously seen version to
ignore out-of-order deliveries.

#### Returns

`void`
