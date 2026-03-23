#!/bin/bash
# 1. Login
echo "Logging in..."
resp=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@primestack.uz", "password":"admin123"}')
echo $resp
TOKEN=$(echo $resp | grep -oP '(?<="token":")[^"]*')
if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi
echo "Got token: $TOKEN"

# 2. Get Settings
echo "Getting settings..."
curl -s -X GET http://localhost:8080/api/v1/admin/settings -H "Authorization: Bearer $TOKEN"
