Endpoint WhatsApp proxy

This backend provides a protected endpoint to send WhatsApp messages from the server.

Route:
- POST /api/v1/notifications/whatsapp/send

Payload:
{
  "to": "+225XXXXXXXXX",
  "message": "Votre message"
}

Configuration (backend .env):
- WHATSAPP_PROVIDER: callmebot | twilio | messagebird | whatsapp_business_api
- CALLMEBOT_API_KEY: key for CallMeBot
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM: for Twilio
- MESSAGEBIRD_API_KEY: for MessageBird
- WHATSAPP_BUSINESS_TOKEN, WHATSAPP_BUSINESS_NUMBER: for WhatsApp Business API (Meta)

Security:
- The endpoint is protected by application auth (`get_current_user`). Keep provider keys out of client bundles.
- The frontend no longer performs direct sends: envoi via backend uniquement.

Usage notes:
- After editing `backend/.env`, rebuild the backend image if using Docker Compose.
- For development, you may keep `WHATSAPP_PROVIDER=callmebot` with a test key.
