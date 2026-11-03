# Academia D&A — Plataforma de Estudio (LMS)

LMS propio de D&A Academy: diplomados, módulos y lecciones; permisos por diplomado;
comunidad, insignias, alumnos destacados y cronograma de clases.

- **Backend:** FastAPI + PostgreSQL (async)
- **Frontend:** Next.js (App Router)
- **Video:** embebido desde VideoPress (solo guardamos el enlace)
- **Despliegue:** 1 servidor (VPS) con Docker — ver `ARCHITECTURE.md`

## Estructura
- `backend/`  — API FastAPI
- `frontend/` — app Next.js
- `infra/`    — Nginx, configs de servidor
- `docs/`     — arquitectura, modelo de datos, roadmap
- `scripts/`  — utilidades (importador masivo de usuarios, etc.)

## Empezar
Ver `ARCHITECTURE.md` (blueprint completo) y `docs/ROADMAP.md` (fases).
