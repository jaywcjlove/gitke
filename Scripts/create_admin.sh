#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://127.0.0.1:2018}
USERNAME=${1:-admin}
PASSWORD=${2:-admin123456}

curl -sS -X POST "$BASE_URL/admin/bootstrap" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  -i
