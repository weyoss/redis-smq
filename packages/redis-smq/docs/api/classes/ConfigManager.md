[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / ConfigManager

# Class: ConfigManager

Manages RedisSMQ configuration operations including retrieval, updates, and reloads.
Provides a high-level interface for interacting with the configuration system,
handling validation, persistence, and cross-instance synchronization.

This class works in conjunction with Configuration (low-level persistence) and
ConfigSync (cross-instance synchronization) to provide a complete configuration
management solution.

## Example

```typescript
// Get current configuration
const config = ConfigManager.getConfig();

// Update configuration
await configManager.updateConfig({ messageAudit: true });

// Reload configuration from Redis
await configManager.reload();
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
This method returns a frozen copy of the configuration to prevent
accidental modifications. All configuration properties are fully parsed
and validated.

#### Returns

[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)

The current parsed configuration object (read-only)

#### Example

```typescript
const config = configManager.getConfig();

// The returned object is frozen and cannot be modified
// config.namespace = 'new-ns'; // This will fail in strict mode
```

---

### getConfigVersion()

> **getConfigVersion**(): `number`

Gets the current configuration version number.
The version number increments with each successful configuration update
and is used for optimistic locking to prevent concurrent modification conflicts.

#### Returns

`number`

The current configuration version number

#### Example

```typescript
const version = configManager.getConfigVersion();
console.log(`Configuration version: ${version}`);
```

---

### reload()

#### Call Signature

> **reload**(): `Promise`\<[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)\>

Reloads the configuration from Redis storage.
This method fetches the latest configuration from Redis and updates the
internal configuration state. Useful when manual refresh is needed or when
recovering from certain error conditions.

##### Returns

`Promise`\<[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)\>

Promise with the reloaded configuration if callback not provided

##### Example

```typescript
// Using async/await
const config = await configManager.reload();

// Using callback
configManager.reload((err, config) => {
  if (err) {
    console.error('Failed to reload config:', err);
    return;
  }
  console.log('Config reloaded:', config);
});
```

#### Call Signature

> **reload**(`cb`): `void`

Reloads the configuration from Redis storage.
This method fetches the latest configuration from Redis and updates the
internal configuration state. Useful when manual refresh is needed or when
recovering from certain error conditions.

##### Parameters

###### cb

`ICallback`\<[`IRedisSMQParsedConfig`](../interfaces/IRedisSMQParsedConfig.md)\>

Optional callback function for error-first pattern

##### Returns

`void`

Promise with the reloaded configuration if callback not provided

##### Example

```typescript
// Using async/await
const config = await configManager.reload();

// Using callback
configManager.reload((err, config) => {
  if (err) {
    console.error('Failed to reload config:', err);
    return;
  }
  console.log('Config reloaded:', config);
});
```

---

### updateConfig()

#### Call Signature

> **updateConfig**(`updates`): `Promise`\<`void`\>

Updates the configuration with the provided changes.
This method merges the updates with the current configuration, validates the
resulting configuration, and persists it to Redis. If the updated configuration
is identical to the current configuration, no operation is performed.

The update operation is atomic and uses optimistic locking with version checking.
If a version mismatch occurs (another instance updated the config concurrently),
the operation will fail and the caller should retry after reloading.

##### Parameters

###### updates

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Partial configuration object containing the changes to apply

##### Returns

`Promise`\<`void`\>

Promise that resolves when update is complete if callback not provided

##### Throws

If the updated configuration fails validation

##### Example

```typescript
// Update multiple settings
await configManager.updateConfig({
  redis: { host: 'redis.example.com', port: 6379 },
  logger: { level: 'debug' },
});

// Using callback
configManager.updateConfig({ redis: { host: 'new-host' } }, (err) => {
  if (err) {
    console.error('Update failed:', err);
    return;
  }
  console.log('Configuration updated successfully');
});
```

#### Call Signature

> **updateConfig**(`updates`, `cb`): `void`

Updates the configuration with the provided changes.
This method merges the updates with the current configuration, validates the
resulting configuration, and persists it to Redis. If the updated configuration
is identical to the current configuration, no operation is performed.

The update operation is atomic and uses optimistic locking with version checking.
If a version mismatch occurs (another instance updated the config concurrently),
the operation will fail and the caller should retry after reloading.

##### Parameters

###### updates

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Partial configuration object containing the changes to apply

###### cb

`ICallback`

Optional callback function for error-first pattern

##### Returns

`void`

Promise that resolves when update is complete if callback not provided

##### Throws

If the updated configuration fails validation

##### Example

```typescript
// Update multiple settings
await configManager.updateConfig({
  redis: { host: 'redis.example.com', port: 6379 },
  logger: { level: 'debug' },
});

// Using callback
configManager.updateConfig({ redis: { host: 'new-host' } }, (err) => {
  if (err) {
    console.error('Update failed:', err);
    return;
  }
  console.log('Configuration updated successfully');
});
```
