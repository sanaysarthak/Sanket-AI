
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email_alert(recipient_email: str, subject: str, body: str, sender_email: str = None):
    # App Password should be provided via environment variables
    # Do not hardcode credentials in source code
    import os
    if sender_email is None:
        sender_email = os.getenv('SENDER_EMAIL')
    APP_PASSWORD = os.getenv('SMTP_APP_PASSWORD') 
    
    print(f"\n[EMAIL SYSTEM] Initializing SMTP connection to send alert...")
    print(f"FROM:   {sender_email}")
    print(f"TO:     {recipient_email}")
    
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to Google SMTP Server
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, APP_PASSWORD)
            server.send_message(msg)
            
        print(f"[EMAIL SYSTEM] SUCCESS: Email sent to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"[EMAIL SYSTEM] ERROR: Failed to send email. Reason: {e}")
        return False
