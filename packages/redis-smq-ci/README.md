# RedisSMQ CI

> 💡 **Note:** You are viewing the `next` branch with upcoming features. For stable releases, check the [`master` branch](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-ci).

CLI tools for RedisSMQ - Utilities for continuous integration and release management.

## Commands

### `consolidate-changelog`

Consolidates multiple pre-release changelog entries into a single final release changelog.

#### Usage

```bash
redis-smq-ci consolidate-changelog [input] [output] [options]
```

#### Arguments

| Argument | Description                             | Default                     |
| -------- | --------------------------------------- | --------------------------- |
| `input`  | Input changelog file path               | `CHANGELOG.md`              |
| `output` | Output consolidated changelog file path | Auto-generated from version |

#### Options

| Option                    | Description                                   | Default                |
| ------------------------- | --------------------------------------------- | ---------------------- |
| `-p, --preserve-order`    | Preserve original version order               | `false` (newest first) |
| `-d, --dry-run`           | Preview changes without writing to file       | `false`                |
| `-v, --verbose`           | Show detailed processing information          | `false`                |
| `-o, --output-dir <dir>`  | Output directory (overrides output path)      | -                      |
| `-f, --force`             | Overwrite output file if it exists            | `false`                |
| `-s, --since <version>`   | Only include versions since specified version | Auto-detected          |
| `-u, --until <version>`   | Only include versions until specified version | -                      |
| `--no-metadata`           | Exclude generation metadata comment           | Include metadata       |
| `--section-order <order>` | Comma-separated list of section order         | -                      |

---

### `sync-releases`

Sync GitHub releases with `CHANGELOG.md`. The changelog file is the source of truth - GitHub releases will be created, updated, or deleted to match it exactly.

#### Usage

```bash
redis-smq-ci sync-releases [options]
```

#### Options

| Option                      | Description                                                   | Default          |
| --------------------------- | ------------------------------------------------------------- | ---------------- |
| `-f, --from <version>`      | Only process releases from this version (inclusive)           | -                |
| `-t, --to <version>`        | Only process releases up to this version (inclusive)          | -                |
| `-c, --changelog <path>`    | Path to CHANGELOG.md file                                     | `CHANGELOG.md`   |
| `-d, --dry-run`             | Show what would be updated without making changes             | `false`          |
| `--delete`                  | Delete GitHub releases within range before syncing            | `false`          |
| `-v, --verbose`             | Show detailed processing information                          | `false`          |
| `--token <token>`           | GitHub token (or set `GITHUB_TOKEN` environment variable)     | -                |

#### Environment Variables

| Variable        | Description                                    |
| --------------- | ---------------------------------------------- |
| `GITHUB_TOKEN`  | GitHub personal access token (required)        |

#### Examples

```bash
# Preview what would change (dry run)
redis-smq-ci sync-releases --dry-run

# Sync all releases (creates/updates from CHANGELOG.md)
redis-smq-ci sync-releases

# Sync releases up to a specific version
redis-smq-ci sync-releases -t v8.0.0-rc.29

# Sync releases from a version onward
redis-smq-ci sync-releases -f v1.0.0

# Sync releases within a version range
redis-smq-ci sync-releases -f v1.0.0 -t v8.0.0

# Delete and recreate releases within range
redis-smq-ci sync-releases -f v8.0.0 --delete

# Use custom changelog path with verbose output
redis-smq-ci sync-releases -c packages/redis-smq/CHANGELOG.md -v

# Use specific GitHub token
redis-smq-ci sync-releases --token ghp_xxxxxxxxxxxx
```

#### What It Does

1. **Extracts versions** from `CHANGELOG.md` (supports both `## [version]` and `## version (date)` formats)
2. **Filters versions** based on `--from` and `--to` options
3. **Fetches existing releases** from GitHub
4. **Normalizes release titles** - updates titles like "Release 8.0.0 (2025-04-13)" to just "v8.0.0"
5. **Deletes releases** (if `--delete` is specified) within the version range
6. **Creates/updates releases** from `CHANGELOG.md` content
7. **Preserves version order** from the changelog file

#### Version Comparison Rules

The tool uses semantic versioning rules for comparison:

- `1.0.0` < `1.0.1` < `1.1.0` < `2.0.0`
- `1.2.3-alpha.1` < `1.2.3-beta.1` < `1.2.3-rc.1` < `1.2.3-next.1` < `1.2.3`
- `8.0.0` is considered **greater than** `8.0.0-rc.29` (final release after pre-release)

#### Changelog Format Support

The tool supports both changelog formats:

**Bracket format (new):**
```markdown
## [10.1.0-next.0](https://github.com/owner/repo/compare/v10.0.0...v10.1.0-next.0) (2026-04-07)

### Features
- feature description
```

**Plain format (legacy):**
```markdown
## 8.0.0 (2025-04-13)

### Bug Fixes
- fix description
```

#### Exit Codes

| Code | Description           |
| ---- | --------------------- |
| `0`  | Success               |
| `1`  | Error (invalid input, network issue, authentication failure) |

---

### `update-changelog-hashes`

Replace old commit hashes in `CHANGELOG.md` files with new ones after rewriting Git history with `git-filter-repo`.

#### Usage

```bash
redis-smq-ci update-changelog-hashes [options]
```

#### Options

| Option                      | Description                                                   | Default                          |
| --------------------------- | ------------------------------------------------------------- | -------------------------------- |
| `-m, --commit-map <path>`   | Path to commit-map file                                       | `.git/filter-repo/commit-map`    |
| `-d, --dry-run`             | Preview changes without writing to file                       | `false`                          |
| `-v, --verbose`             | Show detailed processing information                          | `false`                          |
| `--no-backup`               | Skip creating backup files                                    | `false`                          |

#### Examples

```bash
# Preview what would change (dry run)
redis-smq-ci update-changelog-hashes --dry-run

# Update all CHANGELOG.md files with verbose output
redis-smq-ci update-changelog-hashes -v

# Skip creating backup files
redis-smq-ci update-changelog-hashes --no-backup

# Use a custom commit-map location
redis-smq-ci update-changelog-hashes --commit-map ./custom-commit-map
```

#### What It Does

1. **Reads the commit map** from `.git/filter-repo/commit-map` (generated by `git-filter-repo`)
2. **Finds all `CHANGELOG.md` files** in the root directory and under `packages/`
3. **Replaces commit hashes** with their new counterparts:
    - Full 40-character hashes
    - 8-character short hashes
    - 7-character short hashes (most common in changelogs)
4. **Creates backup files** (`.backup` suffix) for each modified file
5. **Preserves original file order** and formatting

#### When to Use

Run this command after using `git-filter-repo` to rewrite Git history (e.g., changing email addresses, removing files, or squashing commits). The `commit-map` file is automatically generated by `git-filter-repo` and contains the old→new hash mappings.

#### Workflow Example

```bash
# 1. Rewrite Git history
git filter-repo --email-callback '
    if email == b"old@example.com":
        return b"new@example.com"
    return email
'

# 2. Update CHANGELOG.md files with new commit hashes
redis-smq-ci update-changelog-hashes

# 3. Verify changes
git diff CHANGELOG.md

# 4. Remove backup files after verification
find . -name "*.backup" -type f -delete

# 5. Commit the updated changelog
git add CHANGELOG.md packages/*/CHANGELOG.md
git commit -m "docs: update commit hashes after history rewrite"
```

---

## License

RedisSMQ CI Library is released under the [MIT License](https://github.com/weyoss/redis-smq/tree/next/LICENSE).