import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings

class EmailService:
    """
    Standard SMTP Email Sender.
    Uses BackgroundTasks pattern for non-blocking execution.
    """
    def __init__(self):
        # 🟢 FIX: Access settings via dot notation, not .get()
        # We use getattr to safely handle cases where config might not be fully reloaded yet
        self.smtp_user = getattr(settings, "SMTP_USER", "")
        self.smtp_password = getattr(settings, "SMTP_PASSWORD", "")
        
        # Determine if email should be enabled
        self.enabled = bool(self.smtp_user and self.smtp_password)
        
        # Load other config values
        self.smtp_server = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = getattr(settings, "SMTP_PORT", 587)
        self.sender_email = getattr(settings, "SMTP_FROM", "noreply@alshifa.com")

    def send_approval_notification(self, to_email: str, name: str, role: str):
        """
        Sends the 'Welcome & Approved' email.
        """
        subject = "🎉 Account Approved - Welcome to Al-Shifa"
        
        # HTML Template for a Professional Look
        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #0d9488;">Welcome to Al-Shifa, {name}!</h2>
              <p>Great news! Your account verification is complete.</p>
              <p><strong>Role:</strong> {role.capitalize()}</p>
              <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">APPROVED ✅</span></p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p>You can now log in to your dashboard to manage appointments and patients.</p>
              <a href="http://localhost:3000/auth/{role}/login" 
                 style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                 Login Now
              </a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                If you did not request this account, please ignore this email.
              </p>
            </div>
          </body>
        </html>
        """

        if not self.enabled:
            print(f"==================================================")
            print(f"[MOCK EMAIL] To: {to_email}")
            print(f"[SUBJECT] {subject}")
            print(f"--------------------------------------------------")
            print(f"Content: Welcome {name}, you are approved!")
            print(f"==================================================")
            return

        try:
            msg = MIMEMultipart()
            msg["From"] = self.sender_email
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.sendmail(self.sender_email, to_email, msg.as_string())
            server.quit()
            print(f"[EMAIL] Sent approval to {to_email}")
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")

email_service = EmailService()