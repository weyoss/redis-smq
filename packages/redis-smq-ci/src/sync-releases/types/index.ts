/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prereleaseType?: string;
  prereleaseNumber?: number;
}

export interface ReleaseInfo {
  id: number;
  tagName: string;
  name: string;
  body: string;
}

export interface SyncReleasesOptions {
  from?: string;
  to?: string;
  changelog?: string;
  dryRun?: boolean;
  delete?: boolean;
  verbose?: boolean;
  token?: string;
}
