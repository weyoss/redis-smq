/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { join, resolve } from 'path';
import { env } from 'redis-smq-common';

const jsonSchemaFilename = 'schema.json';
const openapiSchemaFilename = 'openapi-specs.json';

const curDir = env.getCurrentDir();
const srcDir = resolve(curDir, '../');
const rootDir =
  resolve(srcDir, '../').split('/').pop() === 'redis-smq-rest-api'
    ? resolve(srcDir, '../')
    : resolve(srcDir, '../../..');
const distDir = join(rootDir, 'dist');

const tsConfigPath = resolve(rootDir, './tsconfig.json');
const assetsPath = join(distDir, 'assets');
const jsonSchemaPath = join(assetsPath, jsonSchemaFilename);
const openapiSchemaPath = join(assetsPath, openapiSchemaFilename);

export const constants = {
  srcDir,
  rootDir,
  distDir,
  openapiSchemaFilename,
  tsConfigPath,
  jsonSchemaPath,
  openapiSchemaPath,
  assetsPath,
};
