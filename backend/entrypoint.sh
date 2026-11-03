#!/usr/bin/env bash
set -e
echo "[ENTRYPOINT] Esperando a Postgres..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${POSTGRES_USER:-academia}" >/dev/null 2>&1; do
  sleep 1
done
echo "[ENTRYPOINT] Postgres listo. Creando tablas..."
python -m app.init_db || echo "[ENTRYPOINT] init_db: nada que crear o ya existe"
echo "[ENTRYPOINT] Sembrando admin inicial..."
python -m app.seed || echo "[ENTRYPOINT] seed: omitido"
echo "[ENTRYPOINT] Iniciando Gunicorn (Uvicorn workers)..."
exec gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w "${WEB_CONCURRENCY:-3}" -b 0.0.0.0:8000 --timeout 120
