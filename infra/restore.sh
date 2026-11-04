#!/usr/bin/env bash
# Restaura un respaldo:  ./restore.sh /opt/campusdya/backups/campusdya-XXpart.sql.gz
set -euo pipefail
FILE="${1:?Uso: restore.sh <archivo.sql.gz>}"
echo "Restaurando $FILE ..."
gunzip -c "$FILE" | docker exec -i academia_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
echo "Restore OK."
