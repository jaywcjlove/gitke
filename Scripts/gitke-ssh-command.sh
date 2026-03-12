#!/usr/bin/env bash
set -euo pipefail

# OpenSSH passes command via SSH_ORIGINAL_COMMAND, e.g.:
# git-upload-pack 'owner/repo.git'
# git-receive-pack 'owner/repo.git'
# git-upload-pack '/opt/my-first-app.git'

if [[ -z "${SSH_ORIGINAL_COMMAND:-}" ]]; then
  echo "No command provided" >&2
  exit 1
fi

# Parse command safely: "<cmd> <repo>"
read -r cmd repo extra <<<"${SSH_ORIGINAL_COMMAND}"
repo="${repo//\'/}"
repo="${repo//\"/}"

if [[ -n "${extra:-}" ]]; then
  echo "Invalid SSH command format" >&2
  exit 1
fi

case "$cmd" in
  git-upload-pack|git-receive-pack) ;;
  *)
    echo "Command not allowed: $cmd" >&2
    exit 1
    ;;
esac

if ! command -v "$cmd" >/dev/null 2>&1; then
  echo "Git server command not found: $cmd" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd "${script_dir}/.." && pwd)"

# REPO_ROOT priority:
# 1) explicit REPO_ROOT env
# 2) local checkout default (works on macOS dev and Linux checkout)
# 3) Linux deployment default
if [[ -n "${REPO_ROOT:-}" ]]; then
  repo_root="${REPO_ROOT}"
elif [[ -d "${project_dir}/data/git/repositories" ]]; then
  repo_root="${project_dir}/data/git/repositories"
else
  repo_root="/data/git/repositories"
fi

repo_root="$(cd "$(dirname "${repo_root}")" && pwd)/$(basename "${repo_root}")"

resolve_repo_path() {
  local repo_input="$1"
  local resolved=""

  # Namespace path: owner/repo.git
  if [[ "${repo_input}" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git$ ]]; then
    resolved="${repo_root}/${repo_input}"
  # Absolute path compatibility for ssh://host/opt/*.git
  elif [[ "${repo_input}" =~ ^/opt/[A-Za-z0-9._/-]+\.git$ ]]; then
    resolved="${repo_input}"
  else
    echo "Invalid repository path: ${repo_input}" >&2
    return 1
  fi

  # Normalize for traversal protection.
  # If the path exists, use physical path. If not, normalize parent + basename.
  local normalized=""
  if [[ -e "${resolved}" ]]; then
    normalized="$(cd "${resolved}" && pwd -P)"
  else
    local parent base
    parent="$(dirname "${resolved}")"
    base="$(basename "${resolved}")"
    if [[ -d "${parent}" ]]; then
      normalized="$(cd "${parent}" && pwd -P)/${base}"
    else
      normalized="${resolved}"
    fi
  fi

  # Namespace requests must stay under repo_root.
  if [[ "${repo_input}" =~ ^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+\.git$ ]]; then
    local root_norm
    root_norm="$(cd "${repo_root}" 2>/dev/null && pwd -P || true)"
    if [[ -n "${root_norm}" && "${normalized}" != "${root_norm}"/* ]]; then
      echo "Repository path escapes REPO_ROOT" >&2
      return 1
    fi
  fi

  printf '%s\n' "${normalized}"
}

repo_path="$(resolve_repo_path "${repo}")"

if [[ ! -d "$repo_path" ]]; then
  echo "Repository not found: ${repo_path}" >&2
  exit 1
fi

# TODO: call Gitke API for ACL validation before exec.
exec "$cmd" "$repo_path"
