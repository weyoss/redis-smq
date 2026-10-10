[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IExchangeParsedParams

# Interface: IExchangeParsedParams

An exchange with its routing type resolved.

This is the shape returned by discovery methods (`IExchange`'s three
queries) and stored in the exchange registry. It carries the `type`
because the same name and namespace can never refer to two different
exchange types — the type is fixed at creation time and cannot be
changed without deleting and recreating the exchange.

## Extends

- [`IExchangeParams`](IExchangeParams.md)

## Properties

### name

> **name**: `string`

#### Inherited from

[`IExchangeParams`](IExchangeParams.md).[`name`](IExchangeParams.md#name)

---

### ns

> **ns**: `string`

#### Inherited from

[`IExchangeParams`](IExchangeParams.md).[`ns`](IExchangeParams.md#ns)

---

### type

> **type**: [`EExchangeType`](../enumerations/EExchangeType.md)
