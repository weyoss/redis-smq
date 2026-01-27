/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import bluebird from 'bluebird';
import { env } from '../../src/env/index.js';
import { tmpdir } from 'node:os';

// Create a mock directory structure for testing
const TEST_DIR = join(tmpdir(), '__test_temp__');
const envAsync = bluebird.promisifyAll(env);

describe('findFilesByPattern', () => {
  beforeAll(async () => {
    // Clean up and create test directory structure
    await rm(TEST_DIR, { recursive: true, force: true });

    await mkdir(TEST_DIR, { recursive: true });

    // Create test file structure
    await mkdir(join(TEST_DIR, 'subdir'));
    await mkdir(join(TEST_DIR, 'subdir', 'nested'));
    await mkdir(join(TEST_DIR, 'empty'));

    // Create files with different extensions
    await writeFile(join(TEST_DIR, 'file1.txt'), 'content');
    await writeFile(join(TEST_DIR, 'file2.ts'), 'content');
    await writeFile(join(TEST_DIR, 'file3.js'), 'content');
    await writeFile(join(TEST_DIR, 'subdir', 'file4.txt'), 'content');
    await writeFile(join(TEST_DIR, 'subdir', 'file5.ts'), 'content');
    await writeFile(join(TEST_DIR, 'subdir', 'nested', 'file6.ts'), 'content');
    await writeFile(
      join(TEST_DIR, 'subdir', 'nested', 'file7.test.ts'),
      'content',
    );
    await writeFile(join(TEST_DIR, 'file8.TS'), 'content'); // Uppercase
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  test('should find all .ts files recursively', async () => {
    const files = await envAsync.findFilesByPatternAsync(TEST_DIR, '.ts');
    expect(files).toHaveLength(4);
    expect(files).toEqual(
      expect.arrayContaining([
        join(TEST_DIR, 'file2.ts'),
        join(TEST_DIR, 'subdir', 'file5.ts'),
        join(TEST_DIR, 'subdir', 'nested', 'file6.ts'),
        join(TEST_DIR, 'subdir', 'nested', 'file7.test.ts'),
      ]),
    );
  });

  test('should find all .txt files recursively', async () => {
    const files = await envAsync.findFilesByPatternAsync(TEST_DIR, '.txt');
    expect(files).toHaveLength(2);
    expect(files).toEqual(
      expect.arrayContaining([
        join(TEST_DIR, 'file1.txt'),
        join(TEST_DIR, 'subdir', 'file4.txt'),
      ]),
    );
  });

  test('should find .test.ts files', async () => {
    const files = await envAsync.findFilesByPatternAsync(TEST_DIR, '.test.ts');
    expect(files).toHaveLength(1);
    expect(files?.[0]).toBe(
      join(TEST_DIR, 'subdir', 'nested', 'file7.test.ts'),
    );
  });

  test('should return empty array for non-existent pattern', async () => {
    const files = await envAsync.findFilesByPatternAsync(
      TEST_DIR,
      '.nonexistent',
    );
    expect(files).toEqual([]);
  });

  test('should handle empty directories', async () => {
    const files = await envAsync.findFilesByPatternAsync(
      join(TEST_DIR, 'empty'),
      '.txt',
    );
    expect(files).toEqual([]);
  });

  test('should handle case-sensitive matching', async () => {
    const files = await envAsync.findFilesByPatternAsync(TEST_DIR, '.TS');
    expect(files).toHaveLength(1);
    expect(files?.[0]).toBe(join(TEST_DIR, 'file8.TS'));
  });

  test('should return error for non-existent directory', async () => {
    await expect(
      envAsync.findFilesByPatternAsync(join(TEST_DIR, 'nonexistent'), '.txt'),
    ).rejects.toThrow(Error);
  });
});
