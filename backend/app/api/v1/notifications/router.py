from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import requests
import os
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.api.deps import get_current_user

logger = logging.getLogger("notifications")


def build_session_with_retries(total=3, backoff_factor=0.5, status_forcelist=(502, 503, 504)):
    session = requests.Session()
    retries = Retry(total=total, backoff_factor=backoff_factor, status_forcelist=status_forcelist, allowed_methods=["GET","POST"])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

router = APIRouter(prefix="/api/v1/notifications/whatsapp", tags=["notifications"])


class WhatsAppPayload(BaseModel):
    to: str
    message: str


@router.post("/send")
def send_whatsapp(
    payload: WhatsAppPayload,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict:
    """Envoie un message WhatsApp via le fournisseur configuré côté serveur.

    Configuration attendue (variables d'environnement):
    - WHATSAPP_PROVIDER: callmebot | twilio | messagebird | whatsapp_business_api
    - CALLMEBOT_API_KEY (si provider=callmebot)
    - TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN (si twilio)
    - MESSAGEBIRD_API_KEY (si messagebird)
    - WHATSAPP_BUSINESS_TOKEN / WHATSAPP_BUSINESS_NUMBER (si whatsapp_business_api)
    """
    provider = os.getenv("WHATSAPP_PROVIDER", "callmebot")

    session = build_session_with_retries()
    try:
        if provider == "callmebot":
            api_key = os.getenv("CALLMEBOT_API_KEY")
            if not api_key:
                logger.error("CALLMEBOT provider configured but CALLMEBOT_API_KEY missing")
                raise HTTPException(status_code=500, detail="CALLMEBOT_API_KEY not configured")
            resp = session.get(
                "https://api.callmebot.com/whatsapp.php",
                params={"phone": payload.to, "text": payload.message, "apikey": api_key},
                timeout=10,
            )
            if not resp.ok:
                logger.warning("CallMeBot returned non-ok: %s", resp.text)
                raise HTTPException(status_code=502, detail=f"CallMeBot error: {resp.text}")
            logger.info("CallMeBot send ok to %s", payload.to)
            return {"status": "ok"}

        # Minimal Twilio support via REST API (basic)
        if provider == "twilio":
            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            from_number = os.getenv("TWILIO_WHATSAPP_FROM")
            if not (account_sid and auth_token and from_number):
                raise HTTPException(status_code=500, detail="Twilio not fully configured")
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            data = {
                "From": f"whatsapp:{from_number}",
                "To": f"whatsapp:{payload.to}",
                "Body": payload.message,
            }
            resp = session.post(url, data=data, auth=(account_sid, auth_token), timeout=10)
            if not resp.ok:
                logger.warning("Twilio returned non-ok: %s", resp.text)
                raise HTTPException(status_code=502, detail=f"Twilio error: {resp.text}")
            logger.info("Twilio send ok to %s", payload.to)
            return {"status": "ok"}

        # MessageBird and WhatsApp Business API could be added similarly
        if provider == "messagebird":
            api_key = os.getenv("MESSAGEBIRD_API_KEY")
            if not api_key:
                raise HTTPException(status_code=500, detail="MESSAGEBIRD_API_KEY not configured")
            # MessageBird Conversations API simple text send
            url = "https://conversations.messagebird.com/v1/send"
            headers = {"Authorization": f"AccessKey {api_key}", "Content-Type": "application/json"}
            body = {
                "to": payload.to,
                "type": "text",
                "content": {"text": payload.message},
            }
            resp = session.post(url, json=body, headers=headers, timeout=10)
            if not resp.ok:
                logger.warning("MessageBird returned non-ok: %s", resp.text)
                raise HTTPException(status_code=502, detail=f"MessageBird error: {resp.text}")
            logger.info("MessageBird send ok to %s", payload.to)
            return {"status": "ok"}

        if provider == "whatsapp_business_api":
            token = os.getenv("WHATSAPP_BUSINESS_TOKEN")
            number = os.getenv("WHATSAPP_BUSINESS_NUMBER")
            if not (token and number):
                raise HTTPException(status_code=500, detail="WhatsApp Business API not configured")

            url = f"https://graph.facebook.com/v18.0/{number}/messages"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            body = {
                "messaging_product": "whatsapp",
                "to": payload.to,
                "type": "text",
                "text": {"body": payload.message},
            }
            resp = session.post(url, json=body, headers=headers, timeout=10)
            if not resp.ok:
                logger.warning("WhatsApp Business API returned non-ok: %s", resp.text)
                raise HTTPException(status_code=502, detail=f"WhatsApp Business API error: {resp.text}")
            logger.info("WhatsApp Business API send ok to %s", payload.to)
            return {"status": "ok"}

        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
