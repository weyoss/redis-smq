/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { env } from '../../src/env/index.js';

const TEST_DIR = join(tmpdir(), '__test_temp__');

function findFiles(dir: string, pattern: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    env.findFilesByPattern(dir, pattern, (err, files) =>
      err ? reject(err) : resolve(files ?? []),
    );
  });
}

describe('env.findFilesByPattern', () => {
  beforeAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await mkdir(TEST_DIR, { recursive: true });

    await mkdir(join(TEST_DIR, 'subdir'));
    await mkdir(join(TEST_DIR, 'subdir', 'nested'));
    await mkdir(join(TEST_DIR, 'empty'));

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
    await writeFile(join(TEST_DIR, 'file8.TS'), 'content');
  });

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  test('finds all .ts files recursively', async () => {
    const files = await findFiles(TEST_DIR, '.ts');
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

  test('finds all .txt files recursively', async () => {
    const files = await findFiles(TEST_DIR, '.txt');
    expect(files).toHaveLength(2);
    expect(files).toEqual(
      expect.arrayContaining([
        join(TEST_DIR, 'file1.txt'),
        join(TEST_DIR, 'subdir', 'file4.txt'),
      ]),
    );
  });

  test('finds .test.ts files only', async () => {
    const files = await findFiles(TEST_DIR, '.test.ts');
    expect(files).toHaveLength(1);
    expect(files[0]).toBe(join(TEST_DIR, 'subdir', 'nested', 'file7.test.ts'));
  });

  test('returns an empty array for an unmatched pattern', async () => {
    await expect(findFiles(TEST_DIR, '.nonexistent')).resolves.toEqual([]);
  });

  test('returns an empty array for an empty directory', async () => {
    await expect(findFiles(join(TEST_DIR, 'empty'), '.txt')).resolves.toEqual(
      [],
    );
  });

  test('matches extensions case-sensitively', async () => {
    const files = await findFiles(TEST_DIR, '.TS');
    expect(files).toHaveLength(1);
    expect(files[0]).toBe(join(TEST_DIR, 'file8.TS'));
  });

  test('rejects for a non-existent directory', async () => {
    await expect(
      findFiles(join(TEST_DIR, 'nonexistent'), '.txt'),
    ).rejects.toThrow();
  });
});
