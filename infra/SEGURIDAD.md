# Blindaje de campusdya

## Qué protege el código (se despliega con el push normal)
| Capa | Protección |
|---|---|
| API (FastAPI) | Límite de intentos en login (8 por cuenta / 15 min), recuperar y restablecer contraseña · cabeceras de seguridad (HSTS, anti-iframe, nosniff, CSP en JSON) · `/docs` y `/openapi.json` apagados (no se expone el mapa de la API) · CORS solo con métodos/cabeceras necesarios · subidas verificadas por firma real del archivo (un .exe o .html disfrazado de .png se rechaza) · contraseña mínima de 8 caracteres · aviso en el log si la SECRET_KEY es débil |
| Frontend (Vercel) | Nadie puede meter el campus en un iframe (clickjacking) · HSTS · nosniff · no revela que es Next.js · sin source maps · proxy de imágenes cerrado al backend propio |
| Videos | Reproductor con clic derecho bloqueado y marca de agua móvil con el correo del estudiante |

## Pasos en el droplet (DO) — una sola vez

```bash
# DO · 1. SECRET_KEY fuerte (si ya tienes una de 64+ caracteres, sáltalo: cambiarla cierra todas las sesiones)
cd /opt/campusdya && grep SECRET_KEY .env
python3 -c "import secrets;print(secrets.token_urlsafe(64))"   # pégala en .env como SECRET_KEY=

# DO · 2. Nginx: límites y blindaje
sudo cp infra/nginx/campusdya-limits.conf /etc/nginx/conf.d/
sudo mkdir -p /etc/nginx/snippets && sudo cp infra/nginx/campusdya-security.inc /etc/nginx/snippets/
sudo nano /etc/nginx/sites-available/api.campusdya.com
#   dentro del bloque  server { listen 443 ssl; ... }  añade:
#       include /etc/nginx/snippets/campusdya-security.inc;
#   y dentro de  location / { ... }  añade:
#       limit_req zone=cdya_api burst=80 nodelay;
#       limit_req_status 429;
sudo nginx -t && sudo systemctl reload nginx

# DO · 3. Firewall (solo SSH, HTTP y HTTPS). Revisa antes si dya launch usa otro puerto público.
sudo ufw status
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable

# DO · 4. Bloqueo automático de IPs que atacan SSH
sudo apt update && sudo apt install -y fail2ban unattended-upgrades
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades     # parches de seguridad automáticos

# DO · 5. Redesplegar backend
git pull && docker compose up -d --build backend && docker compose logs --tail=30 backend
```

## Videos en VideoPress (obligatorio para que no se descarguen)
En WordPress.com → VideoPress, en **cada video**:
1. Desactiva **"Permitir descarga"** (Allow download) si aparece activado.
2. Desactiva las opciones de compartir/mostrar enlace del reproductor.
3. No publiques el enlace `/v/` del video en ningún lado fuera del campus (la privacidad "Privado" rompe el reproductor fuera de WordPress, por eso se deja público pero sin difundir el enlace).

Nota honesta: ningún video en streaming es 100 % imposible de capturar (una grabación de pantalla siempre es posible). Por eso la marca de agua con el correo: si un video se filtra, sabes de qué cuenta salió.

## Recomendado después
- Poner **Cloudflare** (plan gratis) delante de campusdya.com y api.campusdya.com: anti-DDoS, WAF y oculta la IP del droplet.
- SSH solo con llave (sin contraseña): `PasswordAuthentication no` en `/etc/ssh/sshd_config`.
