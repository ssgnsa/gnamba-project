from __future__ import annotations

import smtplib
import ssl
from html import escape
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
        safe_link = escape(link, quote=True)
        message.add_alternative(
            "<html><body>"
            "<p>Une demande de réinitialisation du mot de passe de votre compte EGS a été reçue.</p>"
            f'<p><a href="{safe_link}">Réinitialiser mon mot de passe</a></p>'
            "<p>Ce lien est valable pendant 30 minutes.</p>"
            "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>"
            "</body></html>",
            subtype="html",
        )

        context = ssl.create_default_context()
        smtp_factory = smtplib.SMTP_SSL if settings.SMTP_PORT == 465 else smtplib.SMTP
        with smtp_factory(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            if settings.SMTP_PORT != 465:
                smtp.starttls(context=context)
                smtp.ehlo()
            if settings.SMTP_USERNAME:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
