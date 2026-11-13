#!/usr/bin/env bash
# Publica en producción subiendo la versión de los assets, para que ningún
# navegador se quede con el CSS o el JS antiguos.
set -e
cd "$(dirname "$0")/.."
V=$(date +%Y%m%d%H%M)
for f in src/index.html src/noticias.html src/registro.html; do
  sed -i "s/?v=[0-9a-zA-Z]*/?v=$V/g" "$f"
done
echo "versión de assets: $V"
set -a; . "$LOCALAPPDATA/hermes/.env"; set +a
vercel --prod --yes --token "$VERCEL_TOKEN"
