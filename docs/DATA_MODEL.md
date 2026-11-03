# Modelo de datos — Academia D&A

Convenciones: `id` UUID PK, `created_at`/`updated_at` timestamptz en todas.

## users
- email (único), password_hash, name, avatar_url
- role: enum(admin|instructor|alumno)  · default alumno
- status: enum(active|invited|disabled) · default invited
- phone, bio (opcionales)

## diplomas (diplomados)
- title, slug (único), description, cover_url
- status: enum(draft|published) · order int
- created_by -> users.id

## modules (módulos)
- diploma_id -> diplomas.id (cascade)
- title, description, order int, status(draft|published)

## lessons (lecciones)
- module_id -> modules.id (cascade)
- title, slug, videopress_url, content (text/markdown)
- duration_seconds int, order int, status(draft|published)
- materials jsonb  (lista de {nombre, url} para descargables)

## enrollments (permiso por diplomado)
- user_id -> users.id, diploma_id -> diplomas.id   (único por par)
- granted_by -> users.id, granted_at, expires_at (nullable)

## lesson_progress
- user_id, lesson_id (único por par)
- completed bool, completed_at, seconds_watched int

## badges
- name, description, icon, 
- rule_type: enum(first_lesson|complete_module|complete_diploma|streak|manual)
- rule_value int (ej: días de racha, o id de módulo/diploma objetivo)

## user_badges
- user_id, badge_id (único por par), awarded_at

## comments
- lesson_id -> lessons.id, user_id -> users.id
- parent_id -> comments.id (nullable, para respuestas)
- body text, status(visible|hidden)

## schedule_events (cronograma)
- title, description, starts_at timestamptz, ends_at
- diploma_id (nullable), module_id (nullable)
- live_url (nullable)

## Índices clave
- enrollments(user_id), enrollments(diploma_id)
- lessons(module_id, order), modules(diploma_id, order)
- lesson_progress(user_id), comments(lesson_id)

## phases (las 4 fases)
- name, slug (único), description, icon (emoji/planeta), color, order
- (diplomas.phase_id -> phases.id)  # el admin asigna el diplomado a una fase

## teachers (profesores)
- name, bio, photo_url, whatsapp, order, status(active|disabled)

## live_classes (clases en vivo grabadas)
- title, description, videopress_url, happened_at
- diploma_id (nullable), phase_id (nullable), status(published|hidden)

## feedback (opinión del alumno sobre la plataforma)
- user_id -> users.id, body, results (resultados), rating (1-5 opcional), status(visible|hidden)
