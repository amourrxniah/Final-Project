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
        subject="Welcome to MoodSync – Your Journey Starts Here 💜",
        recipients=[email],
        body=f"""
Hi {name},

Welcome to MoodSync! 🎉

Your account has been successfully created and you're now ready to begin tracking your mood and discovering personalised activities.

What you can do next:
• Log your daily mood
• Explore tailored recommendations
• Build positive habits over time

If you did not create this account, please ignore this email.

We're excited to help you track your mood and discover activities that fit your vibe.

Best regards,

The MoodSync Team
support@moodsyncc.app
""",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)