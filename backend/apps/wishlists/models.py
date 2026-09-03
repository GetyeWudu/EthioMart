import uuid
from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
from apps.catalog.models import Product

class WishlistItem(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='in_wishlists')
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('customer', 'product')
        
    def __str__(self):
        return f"{self.customer.email} -> {self.product.title}"
