[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / archive

# Variable: archive

> `const` **archive**: `object`

## Type Declaration

### extractRpm()

> **extractRpm**: (`filePath`, `destinationDirectory`) => `Promise`\<`void`\>

Extracts the contents of an RPM package to a specified directory.

#### Parameters

##### filePath

`string`

The path to the RPM package file.

##### destinationDirectory

`string`

The directory where the extracted contents will be saved.

#### Returns

`Promise`\<`void`\>

- A promise that resolves when the extraction is complete.

#### Throws

Will throw an error if the file does not look like an RPM package.

#### Remarks

This function reads the RPM package file, extracts the payload, and decompresses it using the appropriate command.
The extracted contents are saved in the specified destination directory.

### extractTgz()

> **extractTgz**: (`tgzPath`, `destDir`) => `Promise`\<`void`\>

Extracts a .tgz (tar.gz) file to the specified destination directory.

#### Parameters

##### tgzPath

`string`

The path to the .tgz file.

##### destDir

`string`

The destination directory where the contents will be extracted.

#### Returns

`Promise`\<`void`\>

- A promise that resolves when the extraction is complete.
