"""
apps/core_settings/models.py
============================
Database-backed singleton & key-value configuration system for platform economics.
Enables dynamic updates to commissions, VAT rates, and maintenance toggles without code deployments.
"""

from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel


class PlatformSetting(TimeStampedModel):
    """
    Platform configuration key-value storage.
    """
    class ValueType(models.TextChoices):
        STRING = "STRING", "String"
        DECIMAL = "DECIMAL", "Decimal"
        INTEGER = "INTEGER", "Integer"
        BOOLEAN = "BOOLEAN", "Boolean"
        JSON = "JSON", "JSON"

    key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique identifier for the setting (e.g., base_commission_rate)."
    )
    value = models.TextField(
        help_text="Serialized string representation of the value."
    )
    value_type = models.CharField(
        max_length=20,
        choices=ValueType.choices,
        default=ValueType.STRING,
    )
    description = models.TextField(
        blank=True,
        help_text="Operational description of this setting."
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this setting can be safely returned to unauthenticated clients."
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_settings",
    )

    class Meta:
        verbose_name = "Platform Setting"
        verbose_name_plural = "Platform Settings"
        ordering = ["key"]

    def __str__(self):
        return f"{self.key} = {self.value} ({self.value_type})"
