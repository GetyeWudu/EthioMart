"""
apps/common/models.py
=====================
Abstract base models used across every GechExpress domain.

All concrete models inherit from at least one of these bases to ensure
consistent field naming, UUID primary keys, and soft-delete support.
"""

import uuid
from django.db import models
from django.utils import timezone


class UUIDModel(models.Model):
    """
    Abstract base providing a UUID primary key.
    Prevents sequential ID enumeration on public API endpoints.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        db_index=True,
    )

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """
    Abstract base providing auto-managed created_at / updated_at timestamps.
    """
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteManager(models.Manager):
    """Default manager that excludes soft-deleted records."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager):
    """Manager that returns ALL records including soft-deleted ones."""

    def get_queryset(self):
        return super().get_queryset()


class SoftDeletableModel(models.Model):
    """
    Abstract mixin providing soft-delete functionality.
    Records are marked as deleted via deleted_at timestamp rather than
    being permanently removed from the database.

    Preserves referential integrity for financial/audit records.
    """
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()  # Use explicitly when you need deleted records

    class Meta:
        abstract = True

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def delete(self, using=None, keep_parents=False):
        """Override delete() to perform a soft delete."""
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def hard_delete(self, using=None, keep_parents=False):
        """Permanently delete the record. Use with caution."""
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        """Restore a soft-deleted record."""
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])


class BaseModel(UUIDModel, TimeStampedModel, SoftDeletableModel):
    """
    The canonical base model for GechExpress domain entities.
    Provides UUID PK, timestamps, and soft delete in one mixin.

    Usage:
        class Product(BaseModel):
            name = models.CharField(max_length=255)
    """

    class Meta:
        abstract = True
        ordering = ["-created_at"]
