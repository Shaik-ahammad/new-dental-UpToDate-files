import aiohttp
from core.config import settings

class WhatsAppService:
    """
    Infrastructure layer for WhatsApp (Meta Graph API).
    Used for sending confirmations and reminders.
    """
    def __init__(self):
        self.token = settings.WHATSAPP_TOKEN
        # Note: Replace 'YOUR_PHONE_NUMBER_ID' with actual ID in production or settings
        self.api_url = "https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages"
        
    async def send_message(self, to_number: str, message_body: str):
        """
        Sends a text message via WhatsApp.
        Handles Mocking if no token is provided.
        """
        if not self.token:
            print(f"[MOCK WHATSAPP] To: {to_number} | Msg: {message_body}")
            return True
            
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": message_body}
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, json=payload, headers=headers) as resp:
                    if resp.status == 200:
                        return True
                    else:
                        error_text = await resp.text()
                        print(f"WhatsApp API Error: {error_text}")
                        return False
        except Exception as e:
            print(f"WhatsApp Connection Error: {e}")
            return False

# Singleton
whatsapp_service = WhatsAppService()