# Despliegue — campusdya.com

Arquitectura: **frontend en Vercel** (`campusdya.com`) + **backend/Postgres en el droplet**
de DigitalOcean (`api.campusdya.com`), conviviendo con D&A Launch pero aislado.

## 1) DNS en Hostinger (hazlo primero — propaga en minutos/horas)
En Hostinger → tu dominio campusdya.com → **DNS / Zona DNS**, crea:

| Tipo  | Nombre | Valor | TTL |
|-------|--------|-------|-----|
| A     | `api`  | `IP_DE_TU_DROPLET` | 3600 |
| A     | `@`    | (lo da Vercel al añadir el dominio) | 3600 |
| CNAME | `www`  | (lo da Vercel, ej: `cname.vercel-dns.com`) | 3600 |

> El registro `api` apunta a tu droplet. Los de `@` y `www` te los dice **Vercel**
> exactamente cuando agregues el dominio (paso 3). Si Hostinger no deja `@` como A,
> usa el registro que Vercel indique.

## 2) Backend en el droplet (DigitalOcean)
Repo nuevo en GitHub (ej: `academydaco-rgb/campusdya`). En el droplet:
```
cd /opt && git clone https://github.com/TU_USUARIO/campusdya.git campusdya && cd campusdya
cp .env.example .env && nano .env        # pon claves reales (SECRET_KEY, POSTGRES_PASSWORD)
docker compose up -d --build             # levanta academia_db + academia_backend (puerto 127.0.0.1:8010)
```
Nginx + SSL:
```
sudo cp infra/nginx/api.campusdya.com.conf /etc/nginx/sites-available/api.campusdya.com
sudo ln -s /etc/nginx/sites-available/api.campusdya.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.campusdya.com         # SSL automático
```
Verifica: `curl https://api.campusdya.com/health` → {"status":"ok"}

## 3) Frontend en Vercel
- New Project → importa el repo `campusdya` → **Root Directory: `frontend`**.
- Framework: Next.js (autodetecta). Variable de entorno:
  - `NEXT_PUBLIC_API_URL = https://api.campusdya.com`
- Deploy. Luego **Settings → Domains → agrega `campusdya.com`** (y `www`).
  Vercel te mostrará los **registros DNS exactos** → ponlos en Hostinger (paso 1).

## 4) Primer ingreso
El backend siembra el admin (`academydaco@gmail.com`). La **contraseña temporal** aparece
en los logs: `docker logs academia_backend | grep seed`. Entra, cámbiala y empieza a cargar.

> Nota: el backend corre en el puerto interno **8010** para no chocar con D&A Launch.
