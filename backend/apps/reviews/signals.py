from django.db.models import Avg, Count
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.reviews.models import Review


def _refresh_product_rating(product):
    """
    Recomputes denormalized avg_rating and review_count on the product.
    Only approved reviews are counted — if admin flags a spam review,
    the cache auto-corrects on the next save/delete signal.
    """
    agg = product.reviews.filter(is_approved=True).aggregate(
        avg=Avg('rating'),
        count=Count('id')
    )
    product.avg_rating = round(agg['avg'] or 0, 2)
    product.review_count = agg['count'] or 0
    product.save(update_fields=['avg_rating', 'review_count'])


@receiver(post_save, sender=Review)
def update_rating_on_save(sender, instance, **kwargs):
    _refresh_product_rating(instance.product)


@receiver(post_delete, sender=Review)
def update_rating_on_delete(sender, instance, **kwargs):
    _refresh_product_rating(instance.product)
