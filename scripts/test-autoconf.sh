#!/bin/bash
BEARER="Os27RJHKBnsgDPe41hqGp2mwlben4pAqoYJRVtqT3Xb8DPLPyqg68U0PSv97LyRovrU9machEcR4YKs0613wn7ihHExxyfwwZ9jm9FmiJk9TQVBv2qRyqjhCpMqCDPD4XXxBkeBKqd1BXFzooDK9YZy1FupchMXRqydrGP7ULYRacVHpECiGDkK4cu2JVaIKejAVxUB6Mj1s01gJ9zIohYc0ssuPedapD8wtUlyd21VdFViHl5lWr3RWVbsUAysv"
TOKEN="nv6pV2e5V7VevRlnNjZKJnoUXEIu8iWCNURrhVk4"
BASE="https://api.autoconf.com.br"

echo "=== 1. POST form-data ==="
/usr/bin/curl -s -w "\nHTTP: %{http_code}\n" "$BASE/api/v1/veiculos" \
  -X POST \
  -H "Authorization: Bearer $BEARER" \
  -H "Accept: application/json" \
  -F "revenda_token=$TOKEN"

echo "=== 2. POST x-www-form-urlencoded ==="
/usr/bin/curl -s -w "\nHTTP: %{http_code}\n" "$BASE/api/v1/veiculos" \
  -X POST \
  -H "Authorization: Bearer $BEARER" \
  -H "Accept: application/json" \
  -d "revenda_token=$TOKEN"

echo "=== 3. POST JSON ==="
/usr/bin/curl -s -w "\nHTTP: %{http_code}\n" "$BASE/api/v1/veiculos" \
  -X POST \
  -H "Authorization: Bearer $BEARER" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"revenda_token\":\"$TOKEN\"}"

echo "=== 4. POST empty with token header ==="
/usr/bin/curl -s -w "\nHTTP: %{http_code}\n" "$BASE/api/v1/veiculos" \
  -X POST \
  -H "Authorization: Bearer $BEARER" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "revenda-token: $TOKEN" \
  -d "{}"

echo "=== 5. Try other endpoints ==="
for path in "api/v1/veiculo" "api/v1/estoque" "api/v1/stock" "api/v1/brands" "api/v1/marcas"; do
  code=$(/usr/bin/curl -s -o /dev/null -w "%{http_code}" "$BASE/$path" -X POST \
    -H "Authorization: Bearer $BEARER" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "{\"revenda_token\":\"$TOKEN\"}")
  echo "$code - POST /$path"
done

