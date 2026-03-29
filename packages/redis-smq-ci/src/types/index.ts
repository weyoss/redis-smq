/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IConsolidatedEntry {
  version: string;
  date: string;
  sections: Map<string, Set<string>>;
}

export interface IChangelogEntry {
  version: string;
  date: string;
  sections: Map<string, Set<string>>;
}

export interface IConsolidateOptions {
  inputPath: string;
  outputPath?: string;
  preserveOrder?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  outputDir?: string;
  force?: boolean;
  since?: string;
  until?: string;
  includeMetadata?: boolean;
  sectionOrder?: string[];
}

export interface ICliOptions {
  preserveOrder: boolean;
  dryRun: boolean;
  verbose: boolean;
  outputDir: string;
  force: boolean;
  since: string;
  until: string;
  metadata: boolean;
  sectionOrder: string;
}
