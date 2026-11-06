"""Blindaje de la API: cabeceras de seguridad y límite de intentos (anti fuerza bruta)."""
import time
from collections import defaultdict, deque
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

_SEC_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}
# Las respuestas JSON de la API nunca deben ejecutar nada.
_API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        resp = await call_next(request)
        for k, v in _SEC_HEADERS.items():
            resp.headers.setdefault(k, v)
        if "server" in resp.headers:
            del resp.headers["server"]
        if request.url.path.startswith("/api/"):
            resp.headers.setdefault("Cache-Control", "no-store")
            resp.headers.setdefault("Content-Security-Policy", _API_CSP)
        return resp


def client_ip(request: Request) -> str:
    # Nginx pone la IP real en X-Real-IP (el backend solo escucha en 127.0.0.1).
    return (request.headers.get("x-real-ip")
            or (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
            or (request.client.host if request.client else "?"))


_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(key: str, limit: int, window_s: int) -> None:
    """Ventana deslizante en memoria. Lanza 429 si se supera `limit` en `window_s` segundos."""
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > window_s:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera unos minutos e inténtalo de nuevo.")
    q.append(now)
    if len(_hits) > 50000:  # evita crecer sin límite
        _hits.clear()
