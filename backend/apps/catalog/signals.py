import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.catalog.models import Category
from apps.catalog.services.taxonomy_service import TaxonomyService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Category)
def handle_category_saved(sender, instance, created, **kwargs):
    """Invalidates category tree Redis cache whenever a category is modified."""
    TaxonomyService.invalidate_cache()


@receiver(post_delete, sender=Category)
def handle_category_deleted(sender, instance, **kwargs):
    """Invalidates category tree Redis cache whenever a category is deleted."""
    TaxonomyService.invalidate_cache()
