/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { getDirname } from 'redis-smq-common';

const curDir = getDirname();
const srcDir = resolve(curDir, '../');
const rootDir =
  resolve(srcDir, '../').split('/').pop() === 'redis-smq-rest-api'
    ? resolve(srcDir, '../')
    : resolve(srcDir, '../../..');
const tsConfigPath = resolve(rootDir, './tsconfig.json');
const jsonSchemaPath = resolve(rootDir, './dist/schema.json');
const openApiDocumentFilename = 'openapi-specs.json';
const apiServerPort = 7210;
const apiServerHostname = '127.0.0.1';
const apiServerBasePath = '/';

export const constants = {
  srcDir,
  rootDir,
  openApiDocumentFilename,
  tsConfigPath,
  jsonSchemaPath,
  apiServerHostname,
  apiServerPort,
  apiServerBasePath,
};
