from django.db import models
from apps.common.models import BaseModel
from django.conf import settings

class Notification(BaseModel):
    class NotificationType(models.TextChoices):
        ORDER_UPDATE = "ORDER_UPDATE", "Order Update"
        WALLET_UPDATE = "WALLET_UPDATE", "Wallet Update"
        DISPUTE_ALERT = "DISPUTE_ALERT", "Dispute Alert"
        SYSTEM_ALERT = "SYSTEM_ALERT", "System Alert"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="User receiving the notification"
    )
    type = models.CharField(max_length=50, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_link = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title} ({'Read' if self.is_read else 'Unread'})"
