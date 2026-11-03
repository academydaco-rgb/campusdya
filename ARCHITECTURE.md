# Arquitectura — Academia D&A (LMS)

> La mejor plataforma de estudio: rápida, premium, sin depender de WordPress.
> Documento vivo. Antes de escribir código, aquí está TODO el diseño.

## 1. Visión
Una plataforma de estudio propia para D&A Academy, independiente de dyalaunchsystem.
El admin crea **diplomados → módulos → lecciones**, inscribe alumnos con **permisos por
diplomado**, y los alumnos aprenden con una experiencia tipo Netflix + comunidad:
progreso, insignias, ranking de destacados, comentarios y cronograma de clases.

## 2. Stack
| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Backend/API | **FastAPI** (async) + SQLAlchemy 2 | Mismo stack que ya dominamos en D&A Launch |
| Base de datos | **PostgreSQL 16** | Relacional, robusta, ideal para permisos/jerarquías |
| Frontend | **Next.js (App Router)** + React | SSR, rápido, UX premium |
| Auth | JWT (access token) + hash bcrypt | Simple y seguro |
| Video | **VideoPress (embed)** | Solo guardamos el enlace; cero storage de video de nuestro lado |
| Infra | **Docker Compose** en 1 VPS | Un solo servidor, un solo proveedor |
| Proxy/SSL | **Nginx + Let's Encrypt** | HTTPS y dominio |

## 3. Topología de despliegue (1 solo servidor)
Todo corre en **un VPS con Docker** (sin Vercel, sin repartir en varios lados):

```
                 Internet (tu-dominio.com)
                          │
                    ┌─────▼─────┐
                    │   Nginx   │  (SSL, reverse proxy)
                    └──┬─────┬──┘
           /api/*  ────┘     └──── /*  (todo lo demás)
              │                     │
       ┌──────▼──────┐       ┌──────▼──────┐
       │  FastAPI     │       │  Next.js    │
       │  (backend)   │       │  (frontend) │
       └──────┬───────┘       └─────────────┘
              │
       ┌──────▼──────┐
       │ PostgreSQL  │  (volumen persistente)
       └─────────────┘
```

> **DESPLIEGUE DEFINITIVO (decidido):** Hostinger es hosting compartido (no corre
> FastAPI/Next), así que usamos el stack probado de D&A Launch:
> - **Frontend → Vercel** (proyecto nuevo, dominio de la academia).
> - **Backend + PostgreSQL → droplet de DigitalOcean existente**, en un stack Docker
>   aparte (su propia base de datos y puerto interno 8010), con un server block de
>   Nginx para `api.DOMINIO` → el backend de la academia. Reusamos el droplet que ya
>   pagas; D&A Launch y la Academia conviven en el mismo servidor, aislados por contenedor y BD.

## 4. Modelo de datos
Entidades principales (detalle de campos en `docs/DATA_MODEL.md`):

- **users** — alumnos, instructores y admin. `role`, `status`, `avatar`, datos de perfil.
- **diplomas** (diplomados) — curso de alto nivel. `title`, `slug`, `description`,
  `cover_url`, `status` (draft/published), `order`.
- **modules** (módulos) — pertenecen a un diploma. `title`, `order`, `status`.
- **lessons** (lecciones) — pertenecen a un módulo. `title`, `videopress_url`,
  `content` (texto/recursos), `duration`, `order`, `status`, `materials` (adjuntos).
- **enrollments** (inscripciones = **permiso por diplomado**) — relación user↔diploma.
  Un alumno SOLO ve los diplomados en los que está inscrito. `granted_at`, `expires_at`.
- **lesson_progress** — user↔lesson: `completed`, `completed_at`, `seconds_watched`.
- **badges** (insignias) — catálogo: `name`, `icon`, `rule_type`, `rule_value`.
- **user_badges** — insignias ganadas por usuario, con fecha.
- **comments** — comunidad: hilos por lección. `lesson_id`, `user_id`, `parent_id`,
  `body`, `created_at`. (Moderables por admin/instructor.)
- **schedule_events** (cronograma) — clases/eventos con fecha, opcional enlace en vivo,
  asociados a diploma/módulo.
- **notifications** (opcional fase 2) — avisos a alumnos.

Relaciones: `diploma 1─N module 1─N lesson`; `user N─N diploma` vía `enrollments`;
`user N─N badge` vía `user_badges`; `lesson 1─N comment` (auto-relación por `parent_id`).

## 5. Roles y permisos
- **admin**: controla todo — crea/edita diplomados, módulos, lecciones; inscribe
  usuarios; asigna permisos; gestiona insignias, comunidad y cronograma.
- **instructor**: crea/edita contenido de los diplomados asignados; modera comentarios.
- **alumno**: ve SOLO los diplomados en los que está inscrito; marca progreso; comenta;
  gana insignias; aparece en el ranking.

Regla de oro: toda consulta de contenido de un alumno se filtra por sus `enrollments`.

## 6. API (rutas principales)
```
POST   /api/auth/login           /api/auth/me           POST /api/auth/password/reset
# Admin — contenido
GET/POST/PUT/DELETE  /api/admin/diplomas
GET/POST/PUT/DELETE  /api/admin/modules
GET/POST/PUT/DELETE  /api/admin/lessons
POST   /api/admin/enrollments            (inscribir alumno a diplomado)
DELETE /api/admin/enrollments/{id}
POST   /api/admin/users/import           (carga masiva CSV — migración)
GET/POST/PUT/DELETE  /api/admin/badges
GET/POST/PUT/DELETE  /api/admin/schedule
# Alumno
GET    /api/me/diplomas                  (solo los inscritos)
GET    /api/diplomas/{slug}              (si tiene permiso)
GET    /api/lessons/{id}                 (si tiene permiso)
POST   /api/lessons/{id}/complete        (marca progreso → dispara insignias)
GET/POST /api/lessons/{id}/comments
GET    /api/me/badges     GET /api/leaderboard     GET /api/schedule
```

## 7. Frontend (Next.js — App Router)
```
/login
/(alumno)/inicio                 → mis diplomados, progreso, próximas clases
/(alumno)/diplomado/[slug]       → módulos y lecciones (con candado si no hay permiso)
/(alumno)/leccion/[id]           → player VideoPress + contenido + comentarios + "completar"
/(alumno)/insignias              → mis insignias
/(alumno)/destacados             → ranking
/(alumno)/cronograma             → calendario de clases
/(admin)/panel                   → dashboard
/(admin)/diplomados              → CRUD diplomados/módulos/lecciones (drag & drop orden)
/(admin)/usuarios                → listado, importar CSV, inscribir, permisos
/(admin)/insignias               → reglas
/(admin)/comunidad               → moderación
/(admin)/cronograma              → crear/editar eventos
```
UX premium: diseño oscuro consistente, transiciones suaves, skeletons de carga,
barra de progreso por diplomado, "continuar donde quedé".

## 8. Video (VideoPress)
Cada lección guarda `videopress_url`. El front lo embebe en un `<iframe>` responsivo.
No alojamos ni procesamos video → cero costo de storage y reproducción rápida.

## 9. Migración / carga masiva de usuarios
Endpoint `POST /api/admin/users/import` + script `scripts/import_users.py`:
- Entrada: CSV (`nombre,email` y opcional `diplomados` a inscribir).
- Crea usuarios con contraseña temporal + email de invitación (o enlace de activación).
- Idempotente: si el email existe, actualiza y no duplica.
- Esto es para migrar de la plataforma WordPress vieja. Luego se suben manual uno a uno.

## 10. Motor de insignias
Al marcar una lección como completada, un servicio evalúa reglas:
- `complete_module` → terminó todos los lessons de un módulo.
- `complete_diploma` → terminó el diplomado 100%.
- `streak` → N días seguidos estudiando.
- `first_lesson` → primera lección.
Si cumple y no la tiene, se otorga `user_badge`. Extensible por catálogo.

## 11. Comunidad
Comentarios por lección con respuestas (hilos). Moderación por admin/instructor.
Fase 2: reacciones, menciones, notificaciones.

## 12. Cronograma
Calendario de clases/eventos (fecha, hora Colombia, opcional link en vivo), asociado a
diplomado/módulo. El alumno ve "próximas clases" en su inicio.

## 13. Alumnos destacados (ranking)
Puntaje por actividad: lecciones completadas, racha, diplomados terminados, insignias.
`GET /api/leaderboard` ordena y el front muestra el top.

## 14. Seguridad
- JWT firmado con `SECRET_KEY`; contraseñas con bcrypt.
- Autorización por rol + filtro por `enrollments` en cada acceso a contenido.
- CORS restringido al dominio del front. Rate limiting básico en login.
- Sin secretos en el repo (todo en `.env`, ver `.env.example`).

## 15. Variables de entorno
Ver `.env.example`. Nunca commitear `.env` real.

## 16. Roadmap por fases
Ver `docs/ROADMAP.md`.

---

## 17. Visión de producto (ampliada — definida por Diego)
**Concepto UX "Universo":** navegación tipo sistema solar. Oscuro, negro, premium,
revolucionario. El alumno ve las **4 fases como planetas**; al entrar a una, se
despliegan sus diplomados (cursos). Fácil de entender, elegante, muy llamativo.

**Las 4 fases (capa sobre los diplomados, ruta de ejecución):**
1. Preparación y logística · 2. Creación · 3. Embudos de venta · 4. Optimización y escalamiento.
El admin asigna cada diplomado a una fase (`diploma.phase_id`). Fases sembradas al arranque.

**Todo lo gestiona el admin:** diplomados, módulos, lecciones, usuarios, inscripciones,
comentarios (moderación), feedback (moderación), profesores, clases en vivo y classroom.

**Áreas del alumno:**
- **Dashboard**: diplomados principales, rutas de ejecución (las 4 fases) y CTAs por área.
- **Universo de fases → diplomados → módulos → lecciones** (lección con player VideoPress).
- **Panel de comentarios/feedback**: el alumno opina sobre la plataforma y comparte resultados.
- **Classroom**: calendario de clases que pone el admin.
- **Insignias**: al completar un diplomado obtiene su insignia, la puede **descargar** y
  **compartir en Facebook**.
- **Clases en vivo (grabadas)**: el admin sube las grabaciones; el alumno las ve si faltó.
- **Profesores**: ficha con descripción + número de WhatsApp.

**Diseño:** tema oscuro/negro, acentos tipo neón por fase, animaciones suaves, estética
"brutal"/espacial. Esta es la cara que debe sorprender.
