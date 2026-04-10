/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Octokit } from '@octokit/rest';
import { ReleaseInfo } from './types/index.js';

export class GitHubReleaseManager {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private dryRun: boolean;

  constructor(
    token: string,
    owner: string,
    repo: string,
    dryRun: boolean = false,
  ) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.dryRun = dryRun;
  }

  async getReleases(): Promise<ReleaseInfo[]> {
    const releases: ReleaseInfo[] = [];

    const iterator = this.octokit.paginate.iterator(
      this.octokit.rest.repos.listReleases,
      {
        owner: this.owner,
        repo: this.repo,
        per_page: 100,
      },
    );

    for await (const response of iterator) {
      releases.push(
        ...response.data.map((r) => ({
          id: r.id,
          tagName: r.tag_name,
          name: r.name || '',
          body: r.body || '',
        })),
      );
    }

    return releases;
  }

  async updateReleaseTitle(
    tag: string,
    currentTitle: string,
    newTitle: string,
  ): Promise<boolean> {
    if (this.dryRun) {
      console.log(
        `    🔍 Would update title: "${currentTitle}" -> "${newTitle}"`,
      );
      return true;
    }

    try {
      const release = await this.findReleaseByTag(tag);
      if (!release) return false;

      await this.octokit.rest.repos.updateRelease({
        owner: this.owner,
        repo: this.repo,
        release_id: release.id,
        name: newTitle,
      });
      console.log(`    ✓ Updated title: "${currentTitle}" -> "${newTitle}"`);
      return true;
    } catch (error: unknown) {
      console.log(`    ✗ Failed to update title: ${error}`);
      return false;
    }
  }

  async deleteRelease(tag: string): Promise<boolean> {
    if (this.dryRun) {
      console.log(`    🔍 Would delete release: ${tag}`);
      return true;
    }

    try {
      const release = await this.findReleaseByTag(tag);
      if (!release) return false;

      await this.octokit.rest.repos.deleteRelease({
        owner: this.owner,
        repo: this.repo,
        release_id: release.id,
      });
      console.log(`    ✓ Deleted release: ${tag}`);
      return true;
    } catch (error: unknown) {
      console.log(`    ✗ Failed to delete release: ${error}`);
      return false;
    }
  }

  async createOrUpdateRelease(tag: string, notes: string): Promise<boolean> {
    if (this.dryRun) {
      console.log(`    🔍 Would create/update release: ${tag}`);
      return true;
    }

    try {
      const existing = await this.findReleaseByTag(tag);

      if (existing) {
        await this.octokit.rest.repos.updateRelease({
          owner: this.owner,
          repo: this.repo,
          release_id: existing.id,
          body: notes,
        });
        console.log(`    ✓ Updated release: ${tag}`);
      } else {
        await this.octokit.rest.repos.createRelease({
          owner: this.owner,
          repo: this.repo,
          tag_name: tag,
          name: tag,
          body: notes,
        });
        console.log(`    ✓ Created release: ${tag}`);
      }
      return true;
    } catch (error: unknown) {
      console.log(`    ✗ Failed: ${error}`);
      return false;
    }
  }

  private async findReleaseByTag(tag: string): Promise<ReleaseInfo | null> {
    try {
      const response = await this.octokit.rest.repos.getReleaseByTag({
        owner: this.owner,
        repo: this.repo,
        tag,
      });
      return {
        id: response.data.id,
        tagName: response.data.tag_name,
        name: response.data.name || '',
        body: response.data.body || '',
      };
    } catch {
      return null;
    }
  }
}
