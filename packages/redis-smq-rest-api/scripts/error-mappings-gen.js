#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_FILE = path.resolve(
  __dirname,
  '../src/errors/errors.template.ts',
);
const OUTPUT_FILE = path.resolve(__dirname, '../src/errors/errors.ts');
const PLACEHOLDER = '/* __ERRORS__ */';

// Status code mapping rules. Keep in sync with StatusFor<> in the template.
const getStatusCodeForError = (errorName) => {
  if (errorName.includes('NotFound')) return 404;
  if (errorName.includes('AlreadyExists')) return 409;
  if (errorName.includes('NotEmpty')) return 409;
  if (errorName.includes('RateLimit')) return 429;
  if (errorName.includes('NotSupported')) return 501;
  if (
    errorName.includes('Configuration') ||
    errorName.includes('Invalid') ||
    errorName.includes('Required')
  ) {
    return 400;
  }
  return 500;
};

function renderMappingLines(map) {
  // map is Record<string, [number, string]>
  const lines = [];
  for (const [key, [code, name]] of Object.entries(map)) {
    lines.push(`${key}: [${code}, '${name}'],`);
  }
  return lines.join('\n');
}

async function buildMappings() {
  const { errors } = await import('redis-smq');
  const result = {};
  for (const name of Object.keys(errors)) {
    result[name] = [getStatusCodeForError(name), name];
  }
  return Object.keys(result)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, k) => {
      acc[k] = result[k];
      return acc;
    }, {});
}

function replacePlaceholder(templateContent, mappingText) {
  if (!templateContent.includes(PLACEHOLDER)) {
    throw new Error(
      `Template placeholder not found. Expected: ${PLACEHOLDER}. File: ${TEMPLATE_FILE}`,
    );
  }
  return templateContent.replace(PLACEHOLDER, mappingText);
}

try {
  const templateContent = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const mappings = await buildMappings();
  const mappingText = renderMappingLines(mappings);
  const output = replacePlaceholder(templateContent, mappingText);
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(
    `Generated ${OUTPUT_FILE} with ${Object.keys(mappings).length} error mappings`,
  );
} catch (e) {
  console.error('Failed to generate error mappings:', e);
  process.exit(1);
}
