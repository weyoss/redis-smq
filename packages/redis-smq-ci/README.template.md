# RedisSMQ CI

__NPM_BADGE__

__IS_NEXT_NOTE__

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

## License

RedisSMQ CI Library is released under the [MIT License](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/LICENSE).
