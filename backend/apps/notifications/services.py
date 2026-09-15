import logging
from apps.notifications.models import Notification
from apps.notifications.tasks import send_async_email

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_notification(user, type, title, message, related_link="", send_email=True, html_message=None):
        """
        Creates an in-app Notification record and optionally queues an email.
        """
        try:
            notification = Notification.objects.create(
                user=user,
                type=type,
                title=title,
                message=message,
                related_link=related_link
            )
            
            if send_email and user.email:
                if not html_message:
                    from apps.notifications.email_templates import render_general_notification_html
                    recipient_name = user.get_full_name() or user.first_name or "Valued Customer"
                    html_message = render_general_notification_html(
                        title=title,
                        message=message,
                        user_name=recipient_name,
                        action_url=related_link,
                        action_label="View in EthioMart →",
                        badge=str(type).replace("_", " ").title(),
                    )
                send_async_email.delay(user.email, title, message, html_message)
                
            return notification
        except Exception as e:
            logger.error(f"Failed to create notification for {user.email}: {e}")
            return None

    @staticmethod
    def send_bulk_notification(users, type, title, message, related_link="", send_email=True):
        """
        Creates in-app Notification records in bulk and optionally queues emails.
        """
        try:
            notifications = [
                Notification(
                    user=user,
                    type=type,
                    title=title,
                    message=message,
                    related_link=related_link
                ) for user in users
            ]
            Notification.objects.bulk_create(notifications)
            
            if send_email:
                for user in users:
                    if user.email:
                        send_async_email.delay(user.email, title, message)
                        
            return True
        except Exception as e:
            logger.error(f"Failed to bulk create notifications: {e}")
            return False
