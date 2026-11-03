# Roadmap por fases — Academia D&A

## Fase 0 — Cimientos (esta semana)
- Arquitectura (este doc) ✅
- Scaffold backend (FastAPI + DB + auth + modelos) y frontend (Next + login)
- docker-compose + Nginx + despliegue en el VPS con dominio y SSL
- Seed: 1 admin, 1 diplomado demo con 1 módulo y 1 lección (VideoPress)

## Fase 1 — Núcleo del LMS (MVP usable)
- CRUD admin de diplomados/módulos/lecciones (con orden drag & drop)
- Inscripciones + permisos por diplomado
- Vista alumno: mis diplomados, lección con player VideoPress, marcar completado
- Importador masivo de usuarios (CSV) para migrar de WordPress

## Fase 2 — Experiencia premium
- Progreso por diplomado + "continuar donde quedé"
- Insignias (motor de reglas) y vista de insignias
- Comunidad: comentarios por lección con hilos + moderación
- Cronograma de clases (calendario)
- Alumnos destacados (ranking)

## Fase 3 — Pulido y escala
- Notificaciones, emails de invitación/activación
- Certificados de finalización (PDF)
- Métricas de admin (avance por alumno/diplomado)
- Preparar multi-marca / membresía (a futuro)

## Orden de construcción recomendado
Fase 0 → Fase 1 (esto ya es una plataforma usable para migrar) → Fase 2 → Fase 3.
