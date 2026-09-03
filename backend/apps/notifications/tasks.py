import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task(
    name="notifications.send_async_email",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
)
def send_async_email(user_email: str, title: str, message: str):
    """
    Asynchronously sends an email to avoid blocking the HTTP request cycle.
    """
    try:
        send_mail(
            subject=title,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
        logger.info(f"Notification email sent successfully to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send notification email to {user_email}: {e}")
        raise
