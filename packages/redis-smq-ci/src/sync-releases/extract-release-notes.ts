/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export function extractReleaseNotes(
  version: string,
  content: string,
): string | null {
  const versionWithoutV = version.replace(/^v/, '');
  const lines = content.split('\n');

  const startIndex = lines.findIndex(
    (line) =>
      new RegExp(`^## \\[${versionWithoutV}\\]`).test(line) ||
      new RegExp(`^## ${versionWithoutV} \\(`).test(line),
  );

  if (startIndex === -1) return null;

  const endIndex = lines.findIndex(
    (line, i) => i > startIndex && /^## /.test(line),
  );
  const sliceEnd = endIndex === -1 ? lines.length : endIndex;

  return lines.slice(startIndex, sliceEnd).join('\n');
}
