[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ILoggerParsedConfig

# Interface: ILoggerParsedConfig

The fully-resolved logger configuration.

This is what `IConfigManager.getConfig().logger` returns and what
every internal component reads when it constructs a logger. It is the
product of `parseLoggerConfig`, which collapses the raw
`boolean | ILoggerConfig` union into a single normalized shape.

Differences from the raw form:

- `enabled` is a concrete boolean, resolved from the shorthand
  `true` / `false` forms or defaulted when the raw config was
  omitted.
- `options` is a fully-populated object — every field defined by
  `IConsoleLoggerOptions` has a value, with defaults filled in for
  anything the user did not provide.

The library uses this configuration as follows:

- When `enabled` is false, `createLogger` returns a no-op logger.
  Every method on the no-op logger is a no-op; log calls incur no
  cost beyond a function invocation.
- When `enabled` is true, `createLogger` builds a console logger
  using `options`. The options control the level filter, color
  output, timestamp inclusion, and any other behavior defined by
  `IConsoleLoggerOptions`.

The object is shared across all components in the process. It is not
frozen at the top level, but the library does not mutate it after
construction; callers must not mutate it either.

## Properties

### enabled

> **enabled**: `boolean`

Whether logging is enabled.

When false, every component receives a no-op logger. This is the
default when the raw configuration omits `logger`.

When true, every component receives a console logger configured by
`options`.

The two states are mutually exclusive. There is no partial mode —
a component either logs or it does not.

---

### options

> **options**: `Required`\<`IConsoleLoggerOptions`\>

Options for the console logger.

Every field defined by `IConsoleLoggerOptions` is present. Values
the user did not provide are filled in from the library's defaults
during parsing.

The options are ignored when `enabled` is false — the no-op logger
has no behavior to configure. A caller who later flips `enabled` to
true through `IConfigManager.updateConfig()` will see the options
take effect immediately.

See the `redis-smq-common` package for the full
`IConsoleLoggerOptions` interface, including:

- `logLevel`: minimum severity to emit
- `colorize`: whether to colorize output
- `includeTimestamp`: whether to prefix each line with a timestamp
- any additional fields the console logger supports
