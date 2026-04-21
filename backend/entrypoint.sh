#!/bin/sh
set -e

log() {
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $1"
}

log "Entorno: ${NODE_ENV:-development}"
log "Puerto: ${PORT:-4000}"
log "DB: ${DATABASE_URL%%@*}@***"   # oculta credenciales, muestra host

log "Aplicando migraciones de base de datos..."
npx drizzle-kit migrate
log "Migraciones aplicadas correctamente."

log "Iniciando servidor ScoutPanel..."
exec node dist/index.js
