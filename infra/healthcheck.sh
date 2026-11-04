#!/usr/bin/env bash
# Revisa el backend; si no responde, lo reinicia (método a prueba del bug de compose v1).
cd /opt/campusdya || exit 0
LOG=/opt/campusdya/healthcheck.log
if ! curl -fsS --max-time 10 http://127.0.0.1:8010/health >/dev/null 2>&1; then
  echo "$(date) [ALERTA] backend no responde, reiniciando..." >> "$LOG"
  docker rm -f academia_backend >/dev/null 2>&1 || true
  docker-compose up -d --no-deps backend >> "$LOG" 2>&1
  sleep 8
  if curl -fsS --max-time 10 http://127.0.0.1:8010/health >/dev/null 2>&1; then
    echo "$(date) [OK] backend recuperado." >> "$LOG"
  else
    echo "$(date) [FALLO] no se pudo recuperar el backend." >> "$LOG"
  fi
fi
