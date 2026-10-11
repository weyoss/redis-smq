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
YELLOW='\033[0;33m'
NC='\033[0m'

CHANGELOG_PRESET="./scripts/changelog-presets/conventional-changelog-custom.cjs"

# Set by generate_changelog(); consumed by create_release_stable().
CONSOLIDATED_NOTES_FILE=""

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

error()   { echo -e "${RED}❌ Error: $1${NC}" >&2; exit 1; }
info()    { echo -e "${BLUE}ℹ $1${NC}" >&2; }
success() { echo -e "${GREEN}✓ $1${NC}" >&2; }

# Print recovery hints on non-zero exit so a partial failure is actionable.
cleanup_hint() {
  local status=$?
  [[ $status -eq 0 ]] && return
  {
    echo
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}Release failed (exit $status). Recovery hints:${NC}"
    echo -e "${YELLOW}  Inspect state:${NC}"
    echo    "    git status"
    echo    "    git tag --list 'v*' | tail -5"
    echo    "    git log --oneline -3"
    echo -e "${YELLOW}  If a local tag was created but not pushed:${NC}"
    echo    "    git tag -d v<version>"
    echo    "    git reset --hard HEAD~1"
    echo -e "${YELLOW}  If the tag was pushed but the release failed:${NC}"
    echo    "    git push origin :refs/tags/v<version>   # delete remote tag"
    echo    "    git tag -d v<version>"
    echo    "    git reset --hard origin/HEAD"
    echo -e "${YELLOW}  If publish failed but tag is on the remote:${NC}"
    echo    "    pnpm -r publish --tag <next|latest> --no-git-checks --access public"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  } >&2
}
trap cleanup_hint EXIT

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
# release-notes/release-vX.Y.Z.md file.
#
# ORDERING IS CRITICAL: this must run BEFORE version_stable_prepare.
# Graduating prepends a final ## [X.Y.Z] entry, after which the tool's
# getFirstPreReleaseAfterLastFinal() returns null and produces nothing.
#
# Uses before/after directory snapshots rather than `ls -t` so a committed
# release-notes/ directory with checkout-time mtimes can't confuse the
# "which file is new" detection.
generate_changelog() {
  info "Consolidating release notes..."

  mkdir -p release-notes

  local before after new
  before=$(mktemp)
  after=$(mktemp)

  ls release-notes/release-v*.md 2>/dev/null > "$before" || true

  if ! pnpm changelog:consolidate; then
    rm -f "$before" "$after"
    error "Changelog consolidation failed"
  fi

  ls release-notes/release-v*.md 2>/dev/null > "$after" || true
  new=$(comm -13 <(sort "$before") <(sort "$after") | tail -1)
  rm -f "$before" "$after"

  [[ -z "$new" ]] && error "No new release notes were generated"
  CONSOLIDATED_NOTES_FILE="$new"
  success "Release notes: $new"
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
  git commit -m "chore(release): v${version}" \
    || error "git commit failed"
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

  info "Creating GitHub pre-release v${version}..."
  gh release create "v${version}" \
    --title "v${version}" \
    --prerelease \
    --generate-notes \
    || error "GitHub pre-release creation failed"

  success "GitHub pre-release v${version} created"
}

create_release_stable() {
  local version
  version=$(get_version)

  [[ -z "$CONSOLIDATED_NOTES_FILE" ]] && error "CONSOLIDATED_NOTES_FILE is not set"

  info "Creating GitHub release v${version} from $CONSOLIDATED_NOTES_FILE..."
  gh release create "v${version}" \
    --title "v${version}" \
    --notes-file "$CONSOLIDATED_NOTES_FILE" \
    || error "GitHub release creation failed"

  success "GitHub release v${version} created"
}

# ---------------------------------------------------------------------------
# Publish
# ---------------------------------------------------------------------------
#
# pnpm 11+ speaks OIDC natively in CI. --no-git-checks is required because
# lerna has just rewritten the tree. --provenance attaches a signed SLSA
# attestation linking each tarball to the workflow run (only meaningful in
# CI; pnpm warns and skips locally).
#
# Re-running publish is safe: pnpm skips versions already on the registry,
# so a partial failure can be recovered by re-invoking the same command.

publish_pre() {
  info "Publishing to npm (dist-tag: next)..."
  pnpm -r publish \
    --tag next \
    --no-git-checks \
    --access public \
    --provenance \
    || error "Pre-release publish failed (recovery: pnpm -r publish --tag next --no-git-checks --access public)"
  success "Published to npm@next"
}

publish_stable() {
  info "Publishing to npm (dist-tag: latest)..."
  pnpm -r publish \
    --tag latest \
    --no-git-checks \
    --access public \
    --provenance \
    || error "Stable publish failed (recovery: pnpm -r publish --tag latest --no-git-checks --access public)"
  success "Published to npm@latest"
}

# ---------------------------------------------------------------------------
# Release flows
# ---------------------------------------------------------------------------
#
# Both flows push the version commit and tag to the remote BEFORE running
# publish. This keeps git as the source of truth: if publish fails, the
# tag is on the remote, but pnpm's idempotency lets a manual retry succeed
# without any scripted recovery.

release_pre() {
  info "Pre-release on 'next'"
  require_branch "next"
  require_clean_worktree

  build
  version_pre_prepare
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
[[ -z "${1:-}" ]] && { usage; error "Release mode required"; }

case "$1" in
  pre)    release_pre ;;
  stable) release_stable ;;
  *)      usage; error "Invalid mode: $1" ;;
esac