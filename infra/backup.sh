#!/usr/bin/env bash
# Respaldo diario de la base de datos (pg_dump) con rotación de 14 días.
set -euo pipefail
BACKUP_DIR=/opt/campusdya/backups
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/campusdya-$STAMP.sql.gz"
# Dump desde el contenedor de Postgres (usa su propio POSTGRES_USER/DB)
docker exec -t academia_db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$FILE"
# Rotación: conserva los 14 más recientes
ls -1t "$BACKUP_DIR"/campusdya-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "$(date) Backup OK: $FILE ($(du -h "$FILE" | cut -f1))"
