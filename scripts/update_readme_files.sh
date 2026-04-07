#!/bin/bash

#
# Copyright (c)
# Weyoss <weyoss@outlook.com>
# https://github.com/weyoss
#
# This source code is licensed under the MIT license found in the LICENSE file
# in the root directory of this source tree.
#

set -euxo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

# --- Helper to get current branch name ---
get_current_branch() {
    local branch=""

    # Try normal symbolic ref first (attached HEAD)
    if branch=$(git symbolic-ref --short -q HEAD 2>/dev/null); then
        echo "$branch"
        return 0
    fi

    # Check if we're in a rebase operation
    local rebase_path
    rebase_path="$(git rev-parse --git-path rebase-merge 2>/dev/null)"
    if [ -d "$rebase_path" ]; then
        # During interactive rebase, the original branch is stored in 'head-name'
        if [ -f "$rebase_path/head-name" ]; then
            branch=$(basename "$(cat "$rebase_path/head-name")")
            if [[ -n "$branch" ]]; then
                echo "$branch"
                return 0
            fi
        fi
    fi

    # Check for non-interactive rebase (rebase-apply)
    rebase_path="$(git rev-parse --git-path rebase-apply 2>/dev/null)"
    if [ -d "$rebase_path" ]; then
        # During non-interactive rebase, branch might be in 'orig-head'
        if [ -f "$rebase_path/orig-head" ]; then
            branch=$(git name-rev --name-only --refs=refs/heads/* "$(cat "$rebase_path/orig-head")" 2>/dev/null | head -1)
            if [[ -n "$branch" ]]; then
                echo "$branch"
                return 0
            fi
        fi
    fi

    # If we get here, we couldn't determine the branch
    echo "[update-readme-files] ERROR: Unable to determine current branch name" >&2
    echo "[update-readme-files] Not in attached HEAD state and not in a recognized rebase state" >&2
    return 1
}

# --- Helper to normalize owner/repo from git URL ---
normalize_owner_repo() {
    local path="$1"
    path="${path#*@}"
    path="${path#*//}"
    path="${path#*:}"
    path="${path#*/}"
    path="${path%.git}"
    printf '%s' "$path"
}

# --- Helper Function to Update a Single README ---
update_readme() {
  local template_file="$1"
  local branch="$2"
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
  local owner_repo
  owner_repo="$(normalize_owner_repo "$origin_url")"

  # Choose content based on branch
  local is_master=false
  local is_next=false
  [[ "$branch" == "master" ]] && is_master=true
  [[ "$branch" == "next" ]] && is_next=true

  local note=""
  local npm_badge=""
  local build_badge=""
  local codeql_badge=""
  local codecov_badge=""
  local tag_suffix=""

  # Set tag suffix for npm badges
  if $is_next; then
    tag_suffix="@next"
  else
    tag_suffix=""
  fi

  if [[ "$context" == "root" ]]; then
    # Build the note based on branch type
    if $is_master; then
      note=$(cat <<EOF
> 💡 **Note:** You are on the stable \`master\` branch. For the latest features (including breaking changes), check the [\`next\` branch](https://github.com/$owner_repo/tree/next).
EOF
)
      npm_badge='[![Stable](https://img.shields.io/npm/v/redis-smq/latest?style=flat-square&label=redis-smq%40latest)](https://github.com/'"$owner_repo"'/releases/latest)'
    elif $is_next; then
      note=$(cat <<EOF
> 💡 **Note:** You are viewing the \`next\` branch with upcoming features. For stable releases, check the [\`master\` branch](https://github.com/$owner_repo/tree/master).
EOF
)
      npm_badge='[![Pre-release (next)](https://img.shields.io/npm/v/redis-smq/next?style=flat-square&label=redis-smq%40next)](https://github.com/'"$owner_repo"'/releases)'
    else
      # Generic note for any other branch
      note=$(cat <<EOF
> 💡 **Note:** You are viewing the \`$branch\` branch. For the stable \`master\` branch or latest \`next\` features, check the respective branches.
EOF
)
      # No npm badge for feature branches
      npm_badge=""
    fi

    build_badge='[![Build ('"$branch"')](https://img.shields.io/github/actions/workflow/status/'"$owner_repo"'/tests.yml?branch='"$branch"'&style=flat-square)](https://github.com/'"$owner_repo"'/actions/workflows/tests.yml?query=branch%3A'"$branch"')'
    codeql_badge='[![Code Quality ('"$branch"')](https://img.shields.io/github/actions/workflow/status/'"$owner_repo"'/codeql.yml?branch='"$branch"'&style=flat-square&label=quality)](https://github.com/'"$owner_repo"'/actions/workflows/codeql.yml?query=branch%3A'"$branch"')'
  else # context == "package"
    if $is_master; then
      note=$(cat <<EOF
> 💡 **Note:** You are on the stable \`master\` branch. For the latest features (including breaking changes), check the [\`next\` branch](https://github.com/$owner_repo/tree/next/packages/$package_name).
EOF
)
      npm_badge="[![Stable](https://img.shields.io/npm/v/$package_name/latest?style=flat-square&label=$package_name%40latest)](https://github.com/$owner_repo/releases/latest)"
    elif $is_next; then
      note=$(cat <<EOF
> 💡 **Note:** You are viewing the \`next\` branch with upcoming features. For stable releases, check the [\`master\` branch](https://github.com/$owner_repo/tree/master/packages/$package_name).
EOF
)
      npm_badge="[![Pre-release (next)](https://img.shields.io/npm/v/$package_name/next?style=flat-square&label=$package_name%40next)](https://github.com/$owner_repo/releases)"
    else
      # Generic note for any other branch
      note=$(cat <<EOF
> 💡 **Note:** You are viewing the \`$branch\` branch. For the stable \`master\` branch or latest \`next\` features, check the respective branches.
EOF
)
      npm_badge=""
    fi
    codecov_badge="[![Code Coverage ($branch)](https://img.shields.io/codecov/c/github/$owner_repo/$branch?flag=$package_name&style=flat-square)](https://app.codecov.io/github/$owner_repo/tree/$branch/packages/$package_name)"
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
  content="${content//__BRANCH_NAME__/$branch}"
  content="${content//__TAG_SUFFIX__/$tag_suffix}"

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

# Detect branch once
current_branch="$(get_current_branch)"

echo "[update-readme-files] Generating READMEs for branch: $current_branch"

# Update README files
update_readme "README.template.md" "$current_branch"
for template in packages/*/README.template.md; do
  if [[ -f "$template" ]]; then
    update_readme "$template" "$current_branch"
  fi
done

echo "[update-readme-files] Update complete."