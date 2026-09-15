import logging
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags
from apps.notifications.email_templates import render_general_notification_html

logger = logging.getLogger(__name__)

@shared_task(
    name="notifications.send_async_email",
    queue="notifications",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
)
def send_async_email(user_email: str, title: str, message: str, html_message: str = None):
    """
    Asynchronously sends an email to avoid blocking the HTTP request cycle.
    Automatically wraps any notification in EthioMart's premium HTML email layout.
    """
    try:
        if not html_message:
            html_message = render_general_notification_html(
                title=title,
                message=message,
            )
        plain_message = strip_tags(html_message) or message

        send_mail(
            subject=title,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Notification email sent successfully to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send notification email to {user_email}: {e}")
        raise
