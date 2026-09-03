import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from apps.common.models import BaseModel


class Review(BaseModel):
    """
    A customer product review, gated by proof of delivery.
    One review per customer per product enforced via unique_together.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Star rating from 1 to 5"
    )
    title = models.CharField(max_length=120)
    body = models.TextField()
    is_verified_purchase = models.BooleanField(
        default=True,
        help_text="True if purchase was validated at submission time"
    )
    is_approved = models.BooleanField(
        default=True,
        help_text="Admin moderation flag. False hides the review platform-wide."
    )
    helpful_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('customer', 'product')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'is_approved']),
            models.Index(fields=['customer']),
        ]

    def __str__(self):
        return f"{self.rating}★ review by {self.customer.email} on {self.product.title[:30]}"


class ReviewReply(BaseModel):
    """
    A seller's single reply to a customer review.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.OneToOneField(
        Review,
        on_delete=models.CASCADE,
        related_name='seller_reply'
    )
    seller = models.ForeignKey(
        'vendors.VendorProfile',
        on_delete=models.CASCADE,
        related_name='review_replies'
    )
    body = models.TextField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Seller reply on Review {self.review_id}"


class ReviewHelpfulVote(BaseModel):
    """
    Tracks which customers have marked a review as helpful (prevents double-voting).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='helpful_votes')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='helpful_votes')

    class Meta:
        unique_together = ('review', 'customer')
