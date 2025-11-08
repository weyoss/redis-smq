#!/usr/bin/env bash
# shellcheck shell=bash

#
# Copyright (c)
# Weyoss <weyoss@protonmail.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

# --- Helper Function to Update a Single README ---
update_readme() {
  local template_file="$1"
  local output_file="${template_file%.template.md}.md"

  if [[ ! -f "$template_file" ]]; then
    echo "[update-readme-files] Template file not found: $template_file. Skipping."
    return
  fi

  # Determine context: root vs. package
  local context="root"
  local package_name=""
  if [[ "$template_file" == packages/* ]]; then
    context="package"
    package_name=$(basename "$(dirname "$template_file")")
  fi

  # Determine owner/repo safely
  local origin_url
  origin_url="$(git config --get remote.origin.url || true)"
  if [[ -z "${origin_url}" ]]; then
    origin_url="$(git remote get-url origin 2>/dev/null || true)"
  fi
  normalize_owner_repo() {
    local path="$1"
    path="${path#*@}"
    path="${path#*//}"
    path="${path#*:}"
    path="${path#*/}"
    path="${path%.git}"
    printf '%s' "$path"
  }
  local owner_repo
  owner_repo="$(normalize_owner_repo "$origin_url")"

  # --- Definitive Branch Detection ---
  # This uses `git symbolic-ref` which is the most reliable and direct way
  # to get the current branch name, especially during complex git operations.
  local branch
  branch=$(git symbolic-ref --short -q HEAD)

  if [[ -z "$branch" ]]; then
    # This occurs in a "detached HEAD" state. Defaulting to 'master' is safe.
    echo "[update-readme-files] Detached HEAD detected. Falling back to 'master' branch logic."
    branch="master"
  fi

  # Choose content based on branch and context
  local is_next=false
  [[ "$branch" == "next" ]] && is_next=true

  local note=""
  local npm_badge=""
  local build_badge=""
  local codeql_badge=""
  local codecov_badge=""
  local install_cmd=""
  local docs_prefix=""
  local tag_suffix=""

  if $is_next; then
    tag_suffix="@next"
  else
    tag_suffix=""
  fi

  if [[ "$context" == "root" ]]; then
    if $is_next; then
      note=$(cat <<EOF
> [!NOTE]
> You are viewing the documentation for the "next" branch. These docs describe unreleased changes published under the npm "next" dist-tag.
> For the latest stable documentation, see:
>
> - Master (stable) README: https://github.com/$owner_repo/tree/master
> - Latest release notes/tags: https://github.com/$owner_repo/releases/latest
> - Install stable packages with @latest; pre-release with @next.
EOF
)
      npm_badge='[![Pre-release (next)](https://img.shields.io/npm/v/redis-smq/next?style=flat-square&label=redis-smq%40next)](https://www.npmjs.com/package/redis-smq?activeTab=versions)'
      install_cmd='npm i redis-smq@next redis-smq-common@next --save'
    else
      note=$(cat <<EOF
> [!NOTE]
> You are viewing the documentation for the "master" branch. These docs describe the latest stable release.
> For pre-release documentation, see:
>
> - Next (pre-release) README: https://github.com/$owner_repo/tree/next
> - Latest release notes/tags: https://github.com/$owner_repo/releases/latest
> - Install stable packages with @latest; pre-release with @next.
EOF
)
      npm_badge='[![Stable](https://img.shields.io/npm/v/redis-smq/latest?style=flat-square&label=redis-smq%40latest)](https://www.npmjs.com/package/redis-smq?activeTab=versions)'
      install_cmd='npm i redis-smq redis-smq-common --save'
    fi
    build_badge='[![Build ('"$branch"')](https://img.shields.io/github/actions/workflow/status/'"$owner_repo"'/tests.yml?branch='"$branch"'&style=flat-square)](https://github.com/'"$owner_repo"'/actions/workflows/tests.yml?query=branch%3A'"$branch"')'
    codeql_badge='[![Code Quality ('"$branch"')](https://img.shields.io/github/actions/workflow/status/'"$owner_repo"'/codeql.yml?branch='"$branch"'&style=flat-square&label=quality)](https://github.com/'"$owner_repo"'/actions/workflows/codeql.yml?query=branch%3A'"$branch"')'
  else # context == "package"
    if $is_next; then
      note=$(cat <<EOF
> [!NOTE]
> You are viewing the documentation for the "next" branch. These docs describe unreleased changes published under the npm "next" dist-tag.
> For the latest stable documentation, see:
>
> - Master (stable) README: https://github.com/$owner_repo/tree/master/packages/$package_name
> - Latest release notes/tags: https://github.com/$owner_repo/releases/latest
> - Install stable packages with @latest; pre-release with @next.
EOF
)
      npm_badge="[![Pre-release (next)](https://img.shields.io/npm/v/$package_name/next?style=flat-square&label=$package_name%40next)](https://www.npmjs.com/package/$package_name?activeTab=versions)"
    else
      note=$(cat <<EOF
> [!NOTE]
> You are viewing the documentation for the "master" branch. These docs describe the latest stable release.
> For pre-release documentation, see:
>
> - Next (pre-release) README: https://github.com/$owner_repo/tree/next/packages/$package_name
> - Latest release notes/tags: https://github.com/$owner_repo/releases/latest
> - Install stable packages with @latest; pre-release with @next.
EOF
)
      npm_badge="[![Stable](https://img.shields.io/npm/v/$package_name/latest?style=flat-square&label=$package_name%40latest)](https://www.npmjs.com/package/$package_name?activeTab=versions)"
    fi
    codecov_badge="[![Code Coverage ($branch)](https://img.shields.io/codecov/c/github/$owner_repo/$branch?flag=$package_name&style=flat-square)](https://app.codecov.io/github/$owner_repo/tree/$branch/packages/$package_name)"
    docs_prefix="../../" # Adjust relative links from package dir
  fi

  # --- README Updating ---
  local content
  content=$(<"$template_file")

  # Perform replacements
  content="${content//__IS_NEXT_NOTE__/$note}"
  content="${content//__NPM_BADGE__/$npm_badge}"
  content="${content//__BUILD_BADGE__/$build_badge}"
  content="${content//__CODEQL_BADGE__/$codeql_badge}"
  content="${content//__CODECOV_BADGE__/$codecov_badge}"
  content="${content//__INSTALL_CMD__/$install_cmd}"
  content="${content//__BRANCH_NAME__/$branch}"
  content="${content//__TAG_SUFFIX__/$tag_suffix}"
  content="${content//__DOCS_PREFIX__/$docs_prefix}"

  # Write the final content back to the output file.
  printf '%s' "$content" > "$output_file"

  # Stage file only if it changed
  if ! git diff --quiet -- "$output_file"; then
    git add "$output_file"
    echo "[update-readme-files] Updated and staged $output_file for branch $branch"
  else
    echo "[update-readme-files] $output_file unchanged"
  fi
}

# --- Main Execution ---
echo "[update-readme-files] Updating README.md files..."
update_readme "README.template.md"
for template in packages/*/README.template.md; do
  if [[ -f "$template" ]]; then
    update_readme "$template"
  fi
done
echo "[update-readme-files] Update complete."