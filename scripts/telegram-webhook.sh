#!/usr/bin/env bash
set -euo pipefail

CMD="${1:-set}"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "TELEGRAM_BOT_TOKEN env yo'q"
  exit 1
fi

API_BASE="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"

case "$CMD" in
  set)
    if [[ -z "${TELEGRAM_WEBHOOK_BASE_URL:-}" ]]; then
      echo "TELEGRAM_WEBHOOK_BASE_URL env yo'q"
      exit 1
    fi
    BASE_URL="${TELEGRAM_WEBHOOK_BASE_URL%/}"
    WEBHOOK_URL="${BASE_URL}/api/v1/telegram/webhook"

    if [[ -n "${TELEGRAM_WEBHOOK_SECRET:-}" ]]; then
      curl -sS -X POST "${API_BASE}/setWebhook" \
        -d "url=${WEBHOOK_URL}" \
        -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}" | sed 's/.*/&\n/'
    else
      curl -sS -X POST "${API_BASE}/setWebhook" \
        -d "url=${WEBHOOK_URL}" | sed 's/.*/&\n/'
    fi
    ;;
  info)
    curl -sS "${API_BASE}/getWebhookInfo" | sed 's/.*/&\n/'
    ;;
  delete)
    curl -sS -X POST "${API_BASE}/deleteWebhook" | sed 's/.*/&\n/'
    ;;
  *)
    echo "Foydalanish: scripts/telegram-webhook.sh [set|info|delete]"
    exit 1
    ;;
esac
