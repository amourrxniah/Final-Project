from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

conf = ConnectionConfig(
    MAIL_USERNAME="your@email.com",
    MAIL_PASSWORD="EMAIL_APP_PASSWORD",
    MAIL_FROM="MoodSync <your@email.com>",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

async def send_welcome_email(email: str, name: str):
    message = MessageSchema(
        subject="Welcome to MoodSync 💜",
        recipients=[email],
        body=f"""
Hi {name},

Welcome to MoodSync! 🎉
Your account has been successfully created.

We're excited to help you track your mood and discover activities that fit your vibe.

- The MoodSync Team
""",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)