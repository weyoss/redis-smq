[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ConfigManager

# Class: ConfigManager

Manages RedisSMQ configuration operations.

Provides methods to get, update, and reload configuration,
with validation and cross-instance synchronization.

## Example

```ts
const config = ConfigManager.getConfig();

await configManager.updateConfig({ messageAudit: true });

const newConfig = await configManager.reload();
```

## Constructors

### Constructor

> **new ConfigManager**(): `ConfigManager`

#### Returns

`ConfigManager`

## Methods

### getConfig()

> **getConfig**(): [`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

Gets the current parsed configuration object.

#### Returns

[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

Read-only parsed configuration

#### Example

```ts
const config = configManager.getConfig();
console.log(config.namespace);
```

---

### getConfigVersion()

> **getConfigVersion**(): `number`

Gets the current configuration version number.

#### Returns

`number`

Version number (increments on each update)

#### Example

```ts
const version = configManager.getConfigVersion();
console.log(version);
```

---

### reload()

#### Call Signature

> **reload**(): `Promise`\<[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)\>

Reloads configuration from Redis storage.

##### Returns

`Promise`\<[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const config = await configManager.reload();

// Callback
configManager.reload((err, config) => {
  if (err) throw err;
  console.log(config);
});
```

#### Call Signature

> **reload**(`cb`): `void`

Reloads configuration from Redis storage.

##### Parameters

###### cb

`ICallback`\<[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)\>

(err, config) => void. Returns IRedisSMQParsedConfig

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
const config = await configManager.reload();

// Callback
configManager.reload((err, config) => {
  if (err) throw err;
  console.log(config);
});
```

---

### updateConfig()

#### Call Signature

> **updateConfig**(`updates`): `Promise`\<`void`\>

Updates configuration with provided changes.

##### Parameters

###### updates

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Partial configuration to apply

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await configManager.updateConfig({ messageAudit: true });

// Callback
configManager.updateConfig({ messageAudit: true }, (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **updateConfig**(`updates`, `cb`): `void`

Updates configuration with provided changes.

##### Parameters

###### updates

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Partial configuration to apply

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await configManager.updateConfig({ messageAudit: true });

// Callback
configManager.updateConfig({ messageAudit: true }, (err) => {
  if (err) throw err;
});
```
