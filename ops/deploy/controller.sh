#!/usr/bin/env bash

set -euo pipefail

fail() {
  printf '[egs-deploy-controller] HOLD: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat >&2 <<'EOF'
Usage:
  controller.sh --environment production --ref <40-char-sha> --artifact-dir <dir> --dry-run
  controller.sh --environment production --ref <40-char-sha> --artifact-dir <dir> --authorize-publish

Only the signed frontend publisher is enabled. No controller mode performs a
database migration, changes the current symlink, or directly publishes files.
EOF
  exit 2
}

help() {
  cat >&2 <<'EOF'
Usage:
  controller.sh --environment production --ref <40-char-sha> --artifact-dir <dir> --dry-run
  controller.sh --environment production --ref <40-char-sha> --artifact-dir <dir> --authorize-publish

Only the signed frontend publisher is enabled. No controller mode performs a
database migration, changes the current symlink, or directly publishes files.
EOF
  exit 0
}

environment=
expected_ref=
artifact_dir=
mode=
while (($#)); do
  case "$1" in
    --help|-h)
      help
      ;;
    --environment|--ref|--artifact-dir)
      (($# >= 2)) || usage
      case "$1" in
        --environment) environment="$2" ;;
        --ref) expected_ref="$2" ;;
        --artifact-dir) artifact_dir="$2" ;;
      esac
      shift 2
      ;;
    --dry-run|--authorize-publish)
      [[ -z "$mode" ]] || usage
      mode="$1"
      shift
      ;;
    *)
      usage
      ;;
  esac
done

[[ "$environment" == production ]] || fail "environment '$environment' is not enabled"
[[ "$mode" == --dry-run || "$mode" == --authorize-publish ]] || usage
[[ "$expected_ref" =~ ^[0-9a-f]{40}$ ]] || fail "an immutable 40-character Git SHA is required"
[[ -n "$artifact_dir" && -d "$artifact_dir" && ! -L "$artifact_dir" ]] || fail "artifact directory is missing or invalid"
[[ "${GITHUB_ACTIONS:-}" == true ]] || fail "must run in GitHub Actions"
[[ "${GITHUB_EVENT_NAME:-}" == workflow_dispatch ]] || fail "only an explicit workflow_dispatch is permitted"
[[ "${EGS_PUBLISH_FRONTEND:-}" == true ]] || fail "the publish_frontend approval input is not enabled"
[[ "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ ]] || fail "missing or invalid GitHub Actions run ID"
[[ "${GITHUB_REPOSITORY:-}" == ssgnsa/gnamba-project ]] || fail "unexpected GitHub repository"
[[ "${GITHUB_REF:-}" == refs/heads/main || "${GITHUB_REF:-}" == refs/heads/master ]] || \
  fail "production releases must originate from main or master"
[[ "${EGS_GATE5_STATUS:-HOLD}" == PASS ]] || \
  fail "production is on HOLD until Gate 5 backup and recovery evidence is validated"

for gate in BUILD TYPECHECK LINT FRONTEND_TESTS FRONTEND_ARTIFACT BACKEND CONTAINERS; do
  gate_value="EGS_GATE_${gate}"
  [[ "${!gate_value:-}" == success ]] || fail "required gate $gate did not succeed"
done

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/../.." && pwd)"
actual_ref="$(git -C "$repo_root" rev-parse --verify HEAD)" || fail "cannot resolve checked-out Git SHA"
[[ "$actual_ref" == "$expected_ref" ]] || fail "checked-out commit does not match the approved SHA"
origin="$(git -C "$repo_root" remote get-url origin)" || fail "cannot verify checkout origin"
case "$origin" in
  https://github.com/ssgnsa/gnamba-project.git|https://github.com/ssgnsa/gnamba-project|git@github.com:ssgnsa/gnamba-project.git|ssh://git@github.com/ssgnsa/gnamba-project.git) ;;
  *) fail "checkout origin does not match ssgnsa/gnamba-project" ;;
esac
[[ -z "$(git -C "$repo_root" status --porcelain --untracked-files=all)" ]] || \
  fail "the checked-out release contains uncommitted or untracked changes"

release_dir="${EGS_RELEASE_DIR:-$artifact_dir}"
validator="$script_dir/validate_release.py"
[[ -f "$validator" && ! -L "$validator" ]] || fail "release validator is missing"
validator_args=(
  --dist "$artifact_dir"
  --release-dir "$release_dir"
  --expected-sha "$expected_ref"
  --expected-ref "$GITHUB_REF"
)
[[ "$mode" != --authorize-publish ]] || validator_args+=(--require-signature)
python3 "$validator" "${validator_args[@]}"

if [[ "$mode" == --authorize-publish ]]; then
  [[ "${EGS_PUBLISH_HOST:-}" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || fail "EGS_PUBLISH_HOST is missing or invalid"
  [[ "$EGS_PUBLISH_HOST" != localhost && "$EGS_PUBLISH_HOST" != 127.* ]] || fail "production host cannot be loopback"
  [[ "${EGS_PUBLISH_USER:-}" == egs-release ]] || fail "EGS_PUBLISH_USER must be egs-release"
  [[ -n "${EGS_PUBLISH_SSH_PRIVATE_KEY:-}" ]] || fail "EGS_PUBLISH_SSH_PRIVATE_KEY is missing"
  [[ -n "${EGS_PUBLISH_KNOWN_HOSTS:-}" ]] || fail "EGS_PUBLISH_KNOWN_HOSTS is missing"
  port="${EGS_PUBLISH_PORT:-2222}"
  [[ "$port" =~ ^[0-9]{1,5}$ ]] && ((10#$port >= 1 && 10#$port <= 65535)) || fail "EGS_PUBLISH_PORT is invalid"
fi

printf '[egs-deploy-controller] PASS: %s for %s (run %s)\n' \
  "${mode#--}" "$expected_ref" "$GITHUB_RUN_ID"
