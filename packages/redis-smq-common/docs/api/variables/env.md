[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / env

# Variable: env

> `const` **env**: `object`

## Type Declaration

### CPUMonitor

#### Methods

##### cleanup()

> **cleanup**(): `void`

###### Returns

`void`

##### generateCallerId()

> **generateCallerId**(): `string`

###### Returns

`string`

##### getActiveCallerCount()

> **getActiveCallerCount**(): `number`

###### Returns

`number`

##### getActiveCallers()

> **getActiveCallers**(): readonly `string`[]

###### Returns

readonly `string`[]

##### getBaselineAge()

> **getBaselineAge**(`callerId`): `number` \| `null`

###### Parameters

###### callerId

`string`

###### Returns

`number` \| `null`

##### getMonitorStats()

> **getMonitorStats**(): `object`

###### Returns

`object`

###### activeCallers

> `readonly` **activeCallers**: `number`

###### newestBaseline

> `readonly` **newestBaseline**: `number`

###### oldestBaseline

> `readonly` **oldestBaseline**: `number`

###### totalBaselines

> `readonly` **totalBaselines**: `number`

##### getOneTimeStats()

> **getOneTimeStats**(): `ICPUUsage`

###### Returns

`ICPUUsage`

##### getStats()

> **getStats**(`callerId`): `ICPUUsage`

Get current system-wide CPU usage for a given caller.
Baselines older than maxBaselineAgeMs are cleaned up automatically.

###### Parameters

###### callerId

`string` = `'default'`

###### Returns

`ICPUUsage`

##### getStatsOverInterval()

> **getStatsOverInterval**(`callerId`, `intervalMs`): `Promise`\<`ICPUUsage`\>

One-shot measurement over a fixed interval (useful for scripts / tests).
Cleans up old baselines before starting.

###### Parameters

###### callerId

`string` = `'default'`

###### intervalMs

`number` = `1000`

###### Returns

`Promise`\<`ICPUUsage`\>

##### getStatsWithAutoId()

> **getStatsWithAutoId**(): `object`

###### Returns

`object`

###### callerId

> `readonly` **callerId**: `string`

###### cleanup()

> `readonly` **cleanup**: () => `void`

###### Returns

`void`

###### usage

> `readonly` **usage**: `ICPUUsage`

##### hasCaller()

> **hasCaller**(`callerId`): `boolean`

###### Parameters

###### callerId

`string`

###### Returns

`boolean`

##### removeCaller()

> **removeCaller**(`callerId`): `boolean`

###### Parameters

###### callerId

`string`

###### Returns

`boolean`

##### reset()

> **reset**(): `void`

###### Returns

`void`

##### getInstance()

> `static` **getInstance**(`options`): [`CPUMonitor`](#cpumonitor)

Singleton – first call sets the options, later calls ignore them

###### Parameters

###### options

`ICPUMonitorOptions` = `{}`

###### Returns

[`CPUMonitor`](#cpumonitor)

### doesPathExist()

> **doesPathExist**(`filePath`): `Promise`\<`boolean`\>

Checks if a file or directory exists.

#### Parameters

##### filePath

`string`

The path to check.

#### Returns

`Promise`\<`boolean`\>

- True if the file or directory exists, false otherwise.

### downloadFile()

> **downloadFile**(`url`, `savePath`): `Promise`\<`void`\>

#### Parameters

##### url

`string`

##### savePath

`string`

#### Returns

`Promise`\<`void`\>

### ensureDirectoryExists()

> **ensureDirectoryExists**(`dirPath`): `Promise`\<`void`\>

Creates a directory if it doesn't exist.

#### Parameters

##### dirPath

`string`

The directory path to create.

#### Returns

`Promise`\<`void`\>

### findFilesByPattern()

> **findFilesByPattern**(`directoryPath`, `pattern`, `callback`): `void`

Recursively scan a directory for files ending with a pattern

#### Parameters

##### directoryPath

`string`

The directory to start scanning from

##### pattern

`string`

The pattern to match at the end of filenames (e.g., '.txt', '.ts')

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`string`[]\>

Callback function that receives found files or error

#### Returns

`void`

### getCacheDir()

> **getCacheDir**(): `string`

Gets the appropriate cache directory for the current platform

#### Returns

`string`

The path to the cache directory

### getCurrentDir()

> **getCurrentDir**(): `string`

#### Returns

`string`
