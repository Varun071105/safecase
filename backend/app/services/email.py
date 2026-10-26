import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("safecase.email")
logger.setLevel(logging.INFO)

class EmailService:
    def __init__(self):
        self.enabled = settings.SMTP_ENABLED
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_addr = settings.SMTP_FROM

    def send_notification(self, recipient_email: str, subject: str, message: str, html_content: Optional[str] = None) -> bool:
        """
        Sends an email if SMTP is configured; otherwise records structured notification log in dev mode.
        """
        if not self.enabled or not self.user or not self.password:
            # Development Mode: Log clearly that SMTP is not configured
            logger.info(
                f"[DEV EMAIL LOG] SMTP not configured. Notification generated:\n"
                f"  Recipient: {recipient_email}\n"
                f"  Subject:   {subject}\n"
                f"  Message:   {message[:150]}..."
            )
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_addr
            msg["To"] = recipient_email

            part1 = MIMEText(message, "plain")
            msg.attach(part1)

            if html_content:
                part2 = MIMEText(html_content, "html")
                msg.attach(part2)

            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.sendmail(self.from_addr, [recipient_email], msg.as_string())
            
            logger.info(f"Email sent successfully to {recipient_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
            return False

    def notify_complaint_submitted(self, recipient_email: str, complaint_number: str, complainant_name: str):
        subject = f"[SAFECASE] Complaint Registered — {complaint_number}"
        message = (
            f"Dear {complainant_name},\n\n"
            f"Your scam complaint has been successfully registered with Reference ID: {complaint_number}.\n\n"
            f"Our investigation team has received your submission. You can track status updates and investigator remarks "
            f"in your SAFECASE public safety portal.\n\n"
            f"Thank you for helping safeguard the community.\n"
            f"SAFECASE Anti-Scam Desk"
        )
        return self.send_notification(recipient_email, subject, message)

    def notify_status_change(self, recipient_email: str, complaint_number: str, complainant_name: str, old_status: str, new_status: str, public_remarks: Optional[str] = None):
        subject = f"[SAFECASE] Status Update for Case {complaint_number}: {new_status}"
        remarks_text = f"\nInvestigator Remarks: {public_remarks}\n" if public_remarks else ""
        message = (
            f"Dear {complainant_name},\n\n"
            f"The status of your complaint ({complaint_number}) has been updated from '{old_status}' to '{new_status}'.\n"
            f"{remarks_text}\n"
            f"Log in to your portal to view full details and history.\n\n"
            f"SAFECASE Anti-Scam Desk"
        )
        return self.send_notification(recipient_email, subject, message)

email_service = EmailService()
