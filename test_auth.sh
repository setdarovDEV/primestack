#!/bin/bash

# 1. Login (get 2FA challenge)
echo "Requesting login challenge..."
COOKIE_JAR=$(mktemp)
resp=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@primestack.uz", "password":"admin123"}')
echo $resp

CHALLENGE_ID=$(echo "$resp" | sed -n 's/.*"challenge_id":"\([^"]*\)".*/\1/p')
if [ -z "$CHALLENGE_ID" ]; then
  echo "Failed to get 2FA challenge id"
  rm -f "$COOKIE_JAR"
  exit 1
fi

if [ -z "$OTP_CODE" ]; then
  echo "Set OTP_CODE env var from email and rerun. Example: OTP_CODE=123456 ./test_auth.sh"
  rm -f "$COOKIE_JAR"
  exit 1
fi

# 2. Verify 2FA and receive session cookie
echo "Verifying 2FA..."
verify_resp=$(curl -s -c "$COOKIE_JAR" -X POST http://localhost:8080/api/v1/auth/verify-2fa -H "Content-Type: application/json" -d "{\"challenge_id\":\"$CHALLENGE_ID\", \"code\":\"$OTP_CODE\"}")
echo "$verify_resp"

SESSION=$(awk '$6=="admin_token"{print $7}' "$COOKIE_JAR" | tail -n1)
if [ -z "$SESSION" ]; then
  echo "Failed to get auth session cookie after 2FA"
  rm -f "$COOKIE_JAR"
  exit 1
fi
echo "Session cookie received"

# 3. Get Settings
echo "Getting settings..."
curl -s -b "$COOKIE_JAR" -X GET http://localhost:8080/api/v1/admin/settings
echo

rm -f "$COOKIE_JAR"
