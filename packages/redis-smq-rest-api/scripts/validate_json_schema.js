#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import Ajv from 'ajv';
import fs from 'fs';

const source = 'dist/assets/schema.json';

const schema = JSON.parse(fs.readFileSync(source, 'utf8'));
const ajv = new Ajv({ strict: true }); // strict: false to handle generic type names

try {
  ajv.compile(schema);
  console.log('✅ Schema is valid!');
} catch (error) {
  console.error('❌ Schema validation failed:', error.message);
}
