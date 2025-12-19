/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { env } from 'redis-smq-common';

const curDir = env.getCurrentDir();
const srcDir = resolve(curDir, '../');
const rootDir =
  resolve(srcDir, '../').split('/').pop() === 'redis-smq-rest-api'
    ? resolve(srcDir, '../')
    : resolve(srcDir, '../../..');
const tsConfigPath = resolve(rootDir, './tsconfig.json');
const jsonSchemaPath = resolve(rootDir, './dist/schema.json');
const openApiDocumentFilename = 'openapi-specs.json';

export const constants = {
  srcDir,
  rootDir,
  openApiDocumentFilename,
  tsConfigPath,
  jsonSchemaPath,
};
