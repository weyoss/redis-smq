#!/bin/bash

#
# scripts/release.sh
#
# Pre-release (next branch):
#   Auto-detects prepatch/preminor/premajor from Conventional Commits,
#   publishes to npm with the "next" dist-tag.
#
# Stable release (master branch):
#   Consolidates pre-release notes, graduates to a stable version,
#   commits version bumps + release notes + CHANGELOG.md together,
#   creates a GitHub Release, publishes to npm with the "latest" dist-tag.
#
# npm auth in CI is provided by OIDC trusted publishing. No NPM_TOKEN is
# read or required.
#

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

CHANGELOG_PRESET="./scripts/changelog-presets/conventional-changelog-custom.cjs"

# Path to the release-notes file used by create_release_*. Set by either
# generate_changelog() (stable) or generate_notes_pre() (pre-release).
NOTES_FILE=""

# Fixed path for pre-release notes. Overwritten each run; /tmp is ephemeral
# on CI runners, and locally a single reused file keeps the script simple.
PRE_NOTES_PATH="/tmp/redis-smq-pre-release-notes.md"

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

error()   { echo -e "${RED}❌ Error: $1${NC}" >&2; exit 1; }
info()    { echo -e "${BLUE}ℹ $1${NC}" >&2; }
success() { echo -e "${GREEN}✓ $1${NC}" >&2; }

get_version() {
  local v
  if command -v jq >/dev/null 2>&1; then
    v=$(jq -r '.version' lerna.json 2>/dev/null) || error "Could not parse lerna.json"
  else
    v=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' lerna.json \
      | head -1 | cut -d'"' -f4)
  fi
  [[ -z "$v" || "$v" == "null" ]] && error "No version field in lerna.json"
  echo "$v"
}

is_ci() { [[ "${GITHUB_ACTIONS:-}" == "true" ]]; }

# Check whether the HEAD commit opts out of releasing. Used by the
# pre-release flow so pushes to `next` that don't warrant a version bump
# (docs typos, CI tweaks, .gitignore edits) can skip the release while
# still running tests through the ci workflow.
has_skip_marker() {
  git log -1 --pretty=%B | grep -qF '[skip release]'
}

# In CI the workflow checks out workflow_run.head_sha and reattaches to a
# named branch, but branch protection and worktree state are already
# validated upstream — skip these checks there.
require_branch() {
  if is_ci; then return 0; fi
  local current
  current=$(git rev-parse --abbrev-ref HEAD)
  [[ "$current" == "$1" ]] || error "Must be on '$1' branch (current: $current)"
}

require_clean_worktree() {
  if is_ci; then return 0; fi
  git diff-index --quiet HEAD -- || error "Working tree has uncommitted changes"
}

build() {
  info "Building..."
  pnpm build:clean || error "Build failed"
  success "Build completed"
}

# ---------------------------------------------------------------------------
# Versioning
# ---------------------------------------------------------------------------

# Pre-release on `next`, phase 1: compute the bumped version and rewrite
# package.json + CHANGELOG.md, but do NOT commit, tag, or push yet. This
# keeps the remote clean if anything downstream fails.
version_pre_prepare() {
  info "Computing pre-release version (no commit)..."

  lerna version \
    --conventional-commits \
    --conventional-prerelease \
    --preid next \
    --force-publish \
    --no-git-tag-version \
    --no-push \
    --changelog-preset "$CHANGELOG_PRESET" \
    --yes \
    || error "lerna version (pre-release) failed"

  success "Pre-release version computed: v$(get_version)"
}

# Stable release on `master`, phase 1: graduate to a stable version without
# committing. Run AFTER generate_changelog — graduating prepends a final
# ## [X.Y.Z] entry to CHANGELOG.md, which breaks the consolidation tool's
# pre-release range detection.
version_stable_prepare() {
  info "Computing stable version (no commit)..."

  lerna version \
    --conventional-commits \
    --conventional-graduate \
    --force-publish \
    --no-git-tag-version \
    --no-push \
    --changelog-preset "$CHANGELOG_PRESET" \
    --yes \
    || error "lerna version (stable) failed"

  success "Stable version computed: v$(get_version)"
}

# Consolidate pre-release entries from the root CHANGELOG.md into a single
# release-notes/release-vX.Y.Z.md file. Used by the STABLE flow.
#
# ORDERING IS CRITICAL: this must run BEFORE version_stable_prepare.
# Graduating prepends a final ## [X.Y.Z] entry, after which the tool's
# getFirstPreReleaseAfterLastFinal() returns null and produces nothing.
generate_changelog() {
  info "Consolidating release notes..."

  mkdir -p release-notes

  local before after new
  before=$(mktemp)
  after=$(mktemp)

  ls release-notes/release-v*.md 2>/dev/null > "$before" || true
  pnpm changelog:consolidate || error "Changelog consolidation failed"
  ls release-notes/release-v*.md 2>/dev/null > "$after" || true

  new=$(comm -13 <(sort "$before") <(sort "$after") | tail -1)
  rm -f "$before" "$after"

  [[ -z "$new" ]] && error "No new release notes were generated"
  NOTES_FILE="$new"
  success "Release notes: $new"
}

# Extract the CHANGELOG.md section for the current version into a fixed
# temp path. Used by the PRE-RELEASE flow so the GitHub release body matches
# the conventional-changelog formatting rather than GitHub's auto-generated
# commit list.
#
# Lerna has already written the ## [version] entry during
# version_pre_prepare, so the section exists by the time this runs.
generate_notes_pre() {
  local version
  version=$(get_version)

  # Extract from `## [version]` up to (but not including) the next `## [`
  # heading. The trailing `]` in the header prevents `## [11.0.0-next.1]`
  # from matching `## [11.0.0-next.10]`. The `index(...) == 1` check
  # anchors the match at the start of the line.
  awk -v header="## [${version}]" '
    index($0, header) == 1 { flag = 1 }
    flag && /^## \[/ && index($0, header) != 1 { exit }
    flag { print }
  ' CHANGELOG.md > "$PRE_NOTES_PATH"

  if [[ ! -s "$PRE_NOTES_PATH" ]]; then
    error "No CHANGELOG entry found for version ${version}"
  fi

  NOTES_FILE="$PRE_NOTES_PATH"
  success "Extracted CHANGELOG entry for v${version}"
}

# ---------------------------------------------------------------------------
# Commit, tag, push, release
# ---------------------------------------------------------------------------

# Guard against re-using an existing tag. Checks both the local repo and
# origin, because a fresh CI checkout may not have fetched the tag that a
# prior failed run pushed. Must run BEFORE `git commit` so a false positive
# doesn't leave a dangling local commit behind.
assert_tag_unused() {
  local version=$1

  if git ls-remote --tags origin "refs/tags/v${version}" 2>/dev/null | grep -q .; then
    error "Tag v${version} already exists on origin — bump or delete before retrying"
  fi
  if git rev-parse -q --verify "refs/tags/v${version}" >/dev/null 2>&1; then
    error "Tag v${version} already exists locally — delete it before retrying"
  fi
}

commit_and_tag() {
  local version
  version=$(get_version)

  assert_tag_unused "$version"

  info "Committing and tagging v${version}..."

  git add -A
  git commit -m "v${version}" || error "git commit failed"
  git tag "v${version}" || error "git tag failed"

  success "Committed and tagged v${version}"
}

push_commit_and_tag() {
  local version
  version=$(get_version)

  info "Pushing commit and tag v${version}..."
  git push origin HEAD || error "git push (commit) failed"
  git push origin "v${version}" || error "git push (tag) failed"
  success "Pushed v${version}"
}

create_release_pre() {
  local version
  version=$(get_version)

  [[ -z "$NOTES_FILE" ]] && error "NOTES_FILE is not set"

  info "Creating GitHub pre-release v${version}..."
  gh release create "v${version}" \
    --title "v${version}" \
    --prerelease \
    --notes-file "$NOTES_FILE" \
    || error "GitHub pre-release creation failed"

  success "GitHub pre-release v${version} created"
}

create_release_stable() {
  local version
  version=$(get_version)

  [[ -z "$NOTES_FILE" ]] && error "NOTES_FILE is not set"

  info "Creating GitHub release v${version} from $NOTES_FILE..."
  gh release create "v${version}" \
    --title "v${version}" \
    --notes-file "$NOTES_FILE" \
    || error "GitHub release creation failed"

  success "GitHub release v${version} created"
}

# ---------------------------------------------------------------------------
# Publish
# ---------------------------------------------------------------------------
#
# pnpm 11+ speaks OIDC natively in CI. --no-git-checks is required because
# lerna has just rewritten the tree. --provenance attaches a signed SLSA
# attestation linking each tarball to the workflow run.
#
# Re-running publish is safe: pnpm skips versions already on the registry.

publish_pre() {
  info "Publishing to npm (dist-tag: next)..."
  pnpm -r publish \
    --tag next \
    --no-git-checks \
    --access public \
    --provenance \
    || error "Pre-release publish failed"
  success "Published to npm@next"
}

publish_stable() {
  info "Publishing to npm (dist-tag: latest)..."
  pnpm -r publish \
    --tag latest \
    --no-git-checks \
    --access public \
    --provenance \
    || error "Stable publish failed"
  success "Published to npm@latest"
}

# ---------------------------------------------------------------------------
# Release flows
# ---------------------------------------------------------------------------

release_pre() {
  info "Pre-release on 'next'"

  if has_skip_marker; then
    info "HEAD commit contains [skip release] — skipping pre-release"
    exit 0
  fi

  require_branch "next"
  require_clean_worktree

  build
  version_pre_prepare
  generate_notes_pre
  commit_and_tag
  push_commit_and_tag
  create_release_pre
  publish_pre

  success "Pre-release v$(get_version) published to npm@next"
}

release_stable() {
  info "Stable release on 'master'"
  require_branch "master"
  require_clean_worktree

  build

  # Consolidate BEFORE graduation (see note on generate_changelog).
  generate_changelog

  version_stable_prepare
  commit_and_tag
  push_commit_and_tag
  create_release_stable
  publish_stable

  success "Stable release v$(get_version) published to npm@latest"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: scripts/release.sh [mode]

Modes:
  pre      Pre-release on 'next'      (npm dist-tag: next)
  stable   Stable release on 'master' (npm dist-tag: latest)

Version bumps are detected from Conventional Commits; no bump type is
passed explicitly. Branch is validated locally; in CI it is implied by
the workflow that triggered the run.

Examples:
  scripts/release.sh pre      # 11.0.0-next.0 -> 11.0.0-next.1
  scripts/release.sh stable   # 11.0.0-next.1 -> 11.0.0
EOF
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && { usage; exit 0; }
[[ -z "${1:-}" ]] && { usage; exit 1; }

case "$1" in
  pre)    release_pre ;;
  stable) release_stable ;;
  *)      usage; exit 1 ;;
esac