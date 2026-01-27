[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / env

# Variable: env

> `const` **env**: `object`

## Type Declaration

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
