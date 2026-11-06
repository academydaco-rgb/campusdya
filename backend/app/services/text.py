import re
import unicodedata


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^\w\s-]", "", value).strip().lower()
    value = re.sub(r"[-\s]+", "-", value)
    return value or "item"


_PARTICULAS = {"de", "del", "la", "las", "los", "y", "da", "do", "dos", "van", "von"}


def nombre_propio(value: str | None) -> str:
    """'diego PATARROYO de la cruz' -> 'Diego Patarroyo de la Cruz' (primera letra de cada nombre en mayúscula)."""
    if not value:
        return value or ""
    palabras = re.sub(r"\s+", " ", value).strip().split(" ")
    out = []
    for i, w in enumerate(palabras):
        lw = w.lower()
        if i > 0 and lw in _PARTICULAS:
            out.append(lw)
        else:
            # respeta nombres compuestos con guion o apóstrofo: ana-maría, o'neil
            out.append(re.sub(r"(^|[-'’])(\w)", lambda m: m.group(1) + m.group(2).upper(), lw))
    return " ".join(out)
