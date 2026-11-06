"""Bifurcación de rutas (Ruta A / Ruta B) dentro de un diplomado.

Regla: el estudiante sigue los módulos comunes + UNA ruta. La ruta "elegida" es la que
tiene más lecciones completadas (si empata, la A). El progreso y la insignia se calculan
sobre comunes + ruta elegida, así quien termina su ruta llega al 100 %.
"""


def norm_route(value) -> str | None:
    v = (value or "").strip().upper()
    return v if v in ("A", "B") else None


def pick_route(items, done: set) -> str:
    """items: lista de (route, [lesson_ids]). Devuelve 'A' o 'B'."""
    score = {"A": 0, "B": 0}
    for route, lids in items:
        if route in score:
            score[route] += sum(1 for lid in lids if lid in done)
    return "B" if score["B"] > score["A"] else "A"


def counts(items, done: set, has_routes: bool):
    """Devuelve (total, completadas, ruta_elegida|None) contando comunes + ruta elegida."""
    chosen = pick_route(items, done) if has_routes else None
    total = completed = 0
    for route, lids in items:
        if has_routes and route and route != chosen:
            continue
        total += len(lids)
        completed += sum(1 for lid in lids if lid in done)
    return total, completed, chosen
