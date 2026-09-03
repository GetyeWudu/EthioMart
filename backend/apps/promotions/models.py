import uuid
from django.db import models
from django.conf import settings
from apps.common.models import BaseModel
from apps.vendors.models import VendorProfile
from apps.catalog.models import ProductVariant, Category
from apps.orders.models import Order

class Promotion(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='promotions', help_text="Null if platform-wide admin promotion")
    name = models.CharField(max_length=200)

    class DiscountType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage'
        FIXED = 'FIXED', 'Fixed Amount'

    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, help_text="Percentage or ETB amount")

    class ScopeType(models.TextChoices):
        STORE = 'STORE', 'Store-Wide'
        PRODUCT = 'PRODUCT', 'Specific Products'
        CATEGORY = 'CATEGORY', 'Specific Categories'

    scope_type = models.CharField(max_length=20, choices=ScopeType.choices, default=ScopeType.STORE)
    scope_products = models.ManyToManyField('catalog.Product', blank=True, related_name='promotions')
    scope_categories = models.ManyToManyField(Category, blank=True, related_name='promotions')

    is_coupon_required = models.BooleanField(default=False)
    coupon_code = models.CharField(max_length=50, unique=True, null=True, blank=True)

    starts_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    max_uses = models.PositiveIntegerField(null=True, blank=True)
    max_uses_per_customer = models.PositiveIntegerField(null=True, blank=True)
    current_uses = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.coupon_code if self.is_coupon_required else 'Auto'})"

class PromotionUsage(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    promotion = models.ForeignKey(Promotion, on_delete=models.PROTECT, related_name='usages')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='promotion_usages')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='promotion_usages')
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Promo {self.promotion.coupon_code} used on Order {self.order.order_number}"
