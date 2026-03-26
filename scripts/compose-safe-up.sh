#!/usr/bin/env bash
set -euo pipefail

# Workaround for docker-compose v1.29 "KeyError: 'ContainerConfig'" recreate bug.
# It removes existing service containers first, then runs compose up.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

USE_BUILD=1
if [[ "${1:-}" == "--no-build" ]]; then
  USE_BUILD=0
  shift
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Compose topilmadi. docker compose yoki docker-compose o'rnating." >&2
  exit 1
fi

if [[ "$#" -gt 0 ]]; then
  SERVICES=("$@")
else
  mapfile -t SERVICES < <("${COMPOSE_CMD[@]}" config --services)
fi

if [[ "${#SERVICES[@]}" -eq 0 ]]; then
  echo "Hech qanday service topilmadi." >&2
  exit 1
fi

# If frontend/backend are recreated, also recreate nginx so upstream DNS is refreshed.
needs_nginx=0
has_nginx=0
for svc in "${SERVICES[@]}"; do
  case "$svc" in
    frontend|backend)
      needs_nginx=1
      ;;
    nginx)
      has_nginx=1
      ;;
  esac
done
if [[ "$needs_nginx" -eq 1 && "$has_nginx" -eq 0 ]]; then
  SERVICES+=("nginx")
fi

echo "Compose: ${COMPOSE_CMD[*]}"
echo "Services: ${SERVICES[*]}"

for svc in "${SERVICES[@]}"; do
  ids="$("${COMPOSE_CMD[@]}" ps -a -q "$svc" 2>/dev/null || true)"
  if [[ -n "$ids" ]]; then
    echo "Removing old containers for service: $svc"
    # shellcheck disable=SC2086
    docker rm -f $ids >/dev/null || true
  fi
done

UP_ARGS=(-d)
if [[ "$USE_BUILD" -eq 1 ]]; then
  UP_ARGS+=(--build)
fi

"${COMPOSE_CMD[@]}" up "${UP_ARGS[@]}" "${SERVICES[@]}"
"${COMPOSE_CMD[@]}" ps
