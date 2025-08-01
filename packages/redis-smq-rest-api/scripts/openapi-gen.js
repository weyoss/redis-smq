#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import {
  generateOpenApiDocument,
  saveOpenApiDocument,
} from '../dist/esm/src/lib/openapi-spec/builder.js';
import { routing } from '../dist/esm/src/app/router/routing.js';

// Configure the command-line interface
const program = new Command();

program
  .name('openapi-gen')
  .description('Generate OpenAPI specification from API routes')
  .version('1.0.0')
  .option('-b, --basePath <path>', 'base path for API routes', '/')
  .option('-o, --output <file>', 'output file path', 'dist')
  .parse(process.argv);

// Get the options
const options = program.opts();

// Ensure output directory exists
async function ensureOutputDir(outputPath) {
  const outputDir = path.dirname(outputPath);
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// Main function
async function main() {
  try {
    const { basePath, output: outputPath } = options;

    console.log('Generating OpenAPI specification...');
    console.log(`Base path: ${basePath}`);
    console.log(`Output: ${outputPath}`);

    await ensureOutputDir(outputPath);

    const spec = await generateOpenApiDocument(routing, basePath);
    await saveOpenApiDocument(spec, outputPath);

    console.log(
      `OpenAPI specification successfully generated at ${outputPath}`,
    );
  } catch (error) {
    console.error('Error generating OpenAPI specification:');
    console.error(error);
    process.exit(1);
  }
}

// Execute the main function
main();
