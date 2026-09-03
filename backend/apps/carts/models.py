import uuid
from django.db import models
from django.conf import settings
from apps.common.models import BaseModel

class Cart(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='carts')
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["user", "session_key"]),
        ]

    def __str__(self):
        return f"Cart {self.id} (User: {self.user.email if self.user else 'Guest'})"

    def get_total_items(self):
        return sum(item.quantity for item in self.items.all())

class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    variant = models.ForeignKey('catalog.ProductVariant', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    selected_facility = models.ForeignKey('inventory.WarehouseLocation', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('cart', 'variant')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.quantity} x {self.variant.sku} in Cart {self.cart.id}"

    def delete(self, using=None, keep_parents=False):
        """Override delete to perform a hard delete instead of soft delete.
        Carts are ephemeral and unique_together crashes if rows are soft-deleted.
        """
        return super().hard_delete(using=using, keep_parents=keep_parents)
