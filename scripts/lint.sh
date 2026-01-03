#!/bin/bash

#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

set -euo pipefail

# Extensions (regex alternation for bash's `=~` operator)
ESLINT_EXTS="js|jsx|ts|tsx"
PRETTIER_EXTS="js|jsx|ts|tsx|json|css|scss|less|md|mdx|yml|yaml|html|gql|graphql"

# This function prints a null-delimited list of files to stdout based on the script's arguments.
# Mode 1: If --all is passed, it lists all files in the git repository.
# Mode 2: If file arguments are passed, it uses them (for lint-staged).
# Mode 3: If no arguments are passed, it lists files changed since HEAD.
get_files_stream() {
  if [[ "${1-}" == "--all" ]]; then
    # Mode 1: Format all files tracked by git.
    git ls-files -z
  elif [ "$#" -gt 0 ]; then
    # Mode 2: Use provided file list from arguments.
    printf "%s\0" "$@"
  else
    # Mode 3: Detect changed files using git.
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      return 0
    fi
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
      git diff -z --name-only --diff-filter=ACMRTUXB HEAD
    else
      # No commits yet, so list all files.
      git ls-files -z
    fi
  fi
}

# Initialize arrays for files to be processed.
eslint_files=()
prettier_files=()

# Read the file stream and populate the arrays in a single pass.
while IFS= read -r -d '' file; do
  if [[ "$file" =~ \.(${ESLINT_EXTS})$ ]]; then
    eslint_files+=("$file")
  fi
  if [[ "$file" =~ \.(${PRETTIER_EXTS})$ ]]; then
    prettier_files+=("$file")
  fi
done < <(get_files_stream "$@")

# Run eslint only if there are matching files.
if [ "${#eslint_files[@]}" -gt 0 ]; then
  eslint --fix "${eslint_files[@]}"
fi

# Run prettier only if there are matching files.
if [ "${#prettier_files[@]}" -gt 0 ]; then
  prettier --write "${prettier_files[@]}"
fi