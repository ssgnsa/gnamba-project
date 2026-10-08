from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage
from typing import Protocol

from app.core.config import settings


class PasswordResetMailer(Protocol):
    def is_configured(self) -> bool: ...
    def send_password_reset(self, address: str, link: str) -> None: ...


class SmtpPasswordResetMailer:
    def is_configured(self) -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_FROM)

    def send_password_reset(self, address: str, link: str) -> None:
        if not self.is_configured():
            raise RuntimeError("Password reset email delivery is not configured")

        message = EmailMessage()
        message["Subject"] = "Réinitialisation de votre mot de passe EGS"
        message["From"] = settings.SMTP_FROM
        message["To"] = address
        message.set_content(
            "Une demande de réinitialisation du mot de passe de votre compte EGS a été reçue.\n\n"
            f"Utilisez ce lien dans les 30 minutes : {link}\n\n"
            "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."
        )

        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            if settings.SMTP_USERNAME:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
