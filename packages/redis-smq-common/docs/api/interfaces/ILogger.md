[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ILogger

# Interface: ILogger

## Methods

### createLogger()

> **createLogger**(`ns`): `ILogger`

#### Parameters

##### ns

`string`

#### Returns

`ILogger`

---

### debug()

> **debug**(`message`, ...`params`): `void`

#### Parameters

##### message

`unknown`

##### params

...`unknown`[]

#### Returns

`void`

---

### error()

> **error**(`message`, ...`params`): `void`

#### Parameters

##### message

`unknown`

##### params

...`unknown`[]

#### Returns

`void`

---

### getLogLevel()

> **getLogLevel**(): `number`

#### Returns

`number`

---

### getNamespaces()

> **getNamespaces**(): `string`[]

#### Returns

`string`[]

---

### info()

> **info**(`message`, ...`params`): `void`

#### Parameters

##### message

`unknown`

##### params

...`unknown`[]

#### Returns

`void`

---

### warn()

> **warn**(`message`, ...`params`): `void`

#### Parameters

##### message

`unknown`

##### params

...`unknown`[]

#### Returns

`void`
