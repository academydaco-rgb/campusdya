# Operación del servidor (campusdya)

## Respaldos automáticos de la base de datos
Los respaldos se guardan en `/opt/campusdya/backups` (14 días de rotación).

Instalar (una sola vez en el droplet):
```
chmod +x /opt/campusdya/infra/*.sh
( crontab -l 2>/dev/null; \
  echo "0 3 * * * /opt/campusdya/infra/backup.sh >> /opt/campusdya/backups/backup.log 2>&1"; \
  echo "*/5 * * * * /opt/campusdya/infra/healthcheck.sh" ) | crontab -
```
- Backup diario a las 3:00 am.
- Healthcheck cada 5 minutos (reinicia el backend si se cae).

Backup manual: `/opt/campusdya/infra/backup.sh`
Restaurar: `/opt/campusdya/infra/restore.sh /opt/campusdya/backups/<archivo>.sql.gz`

### Respaldo fuera del servidor (recomendado)
Los backups locales no protegen si el droplet se pierde. Para enviarlos a
DigitalOcean Spaces (S3), instala `s3cmd`/`rclone` y agrega una línea al cron
que suba `/opt/campusdya/backups`. (Pídemelo y lo configuramos con tus llaves.)

## Monitoreo externo (recomendado)
Crea un monitor gratuito en https://uptimerobot.com apuntando a
`https://campusdya.com` (o `https://api.campusdya.com/health`) para recibir
alertas por correo/WhatsApp si el sitio se cae.

## Despliegue del backend (evita el bug de docker-compose v1)
```
cd /opt/campusdya && git pull && docker-compose down && docker-compose up -d --build
```
