import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from app.core.config import settings

_WRAP = """<div style="background:#070a14;padding:28px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#0f1726;border:1px solid rgba(0,255,255,.25);border-radius:16px;overflow:hidden">
    <div style="padding:22px 26px;background:linear-gradient(120deg,#00ffff,#4f7cff);color:#04141c;font-weight:800;font-size:18px">D&A Academy · Campus</div>
    <div style="padding:26px;color:#dfeaf5;font-size:15px;line-height:1.6">{body}</div>
    <div style="padding:16px 26px;color:#7f8aa3;font-size:12px;border-top:1px solid rgba(255,255,255,.08)">campusdya.com · D&A Academy</div>
  </div>
</div>"""


def _btn(url: str, label: str) -> str:
    return f'<a href="{url}" style="display:inline-block;margin:14px 0;padding:12px 22px;background:linear-gradient(120deg,#00ffff,#4f7cff);color:#04141c;font-weight:800;border-radius:12px;text-decoration:none">{label}</a>'


def enabled() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER)


async def send_email(to: str, subject: str, body_html: str) -> bool:
    if not enabled():
        print(f"[mailer] SMTP no configurado; no se envió a {to}")
        return False

    def _send():
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.MAIL_FROM or settings.SMTP_USER
        msg["To"] = to
        msg.set_content("Abre este correo en un cliente compatible con HTML.")
        msg.add_alternative(_WRAP.format(body=body_html), subtype="html")
        ctx = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as s:
            s.ehlo(); s.starttls(context=ctx); s.ehlo()
            s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            s.send_message(msg)

    try:
        await asyncio.to_thread(_send)
        return True
    except Exception as e:  # noqa: BLE001
        print(f"[mailer] error enviando a {to}: {e}")
        return False


async def send_credentials(to: str, name: str, password: str) -> bool:
    login = f"{settings.FRONTEND_URL}/login"
    body = (f"<p>Hola <b>{name}</b>,</p>"
            f"<p>Tu acceso al Campus de D&A Academy ya está listo. Estas son tus credenciales:</p>"
            f"<p><b>Correo:</b> {to}<br><b>Contraseña:</b> {password}</p>"
            f"{_btn(login, 'Ingresar al campus')}"
            f"<p style='color:#7f8aa3;font-size:13px'>Te recomendamos cambiar tu contraseña desde «Mi perfil» al ingresar.</p>")
    return await send_email(to, "Tus credenciales de acceso · D&A Academy", body)


async def send_reset(to: str, name: str, url: str) -> bool:
    body = (f"<p>Hola <b>{name}</b>,</p>"
            f"<p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva:</p>"
            f"{_btn(url, 'Restablecer contraseña')}"
            f"<p style='color:#7f8aa3;font-size:13px'>Si no fuiste tú, ignora este correo. El enlace vence en 1 hora.</p>")
    return await send_email(to, "Restablece tu contraseña · D&A Academy", body)
