[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IBrowserPage

# Interface: IBrowserPage\<T\>

One page of results from a queue-message browser.

The `totalItems` field describes the size of the whole result set, not
the size of `items`. A caller who wants to compute the number of pages
divides `totalItems` by the page size they requested.

## Type Parameters

### T

`T`

## Properties

### items

> **items**: `T`[]

The items in this page.

---

### totalItems

> **totalItems**: `number`

Total number of items in the full result set.
