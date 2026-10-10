[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IExchangeParams

# Interface: IExchangeParams

Identifies an exchange by name and namespace.

The namespace is optional in the public API — when omitted, it
defaults to the configured default namespace. The `IExchangeParams`
type does not model that optionality; it always carries both fields.
The optionality is handled at the API boundary, where a caller can
pass a string or `{ name, ns }`, and the value is resolved before
reaching anything typed as `IExchangeParams`.

## Extended by

- [`IExchangeParsedParams`](IExchangeParsedParams.md)

## Properties

### name

> **name**: `string`

---

### ns

> **ns**: `string`
