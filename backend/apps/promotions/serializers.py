from rest_framework import serializers
from apps.promotions.models import Promotion, PromotionUsage

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = [
            'id', 'vendor', 'name', 'discount_type', 'discount_value',
            'scope_type', 'scope_products', 'scope_categories',
            'is_coupon_required', 'coupon_code', 'starts_at', 'expires_at',
            'max_uses', 'max_uses_per_customer', 'current_uses', 'is_active',
            'created_at'
        ]
        read_only_fields = ['id', 'vendor', 'current_uses', 'created_at']

class CouponValidationSerializer(serializers.Serializer):
    coupon_code = serializers.CharField(max_length=50)
    cart_id = serializers.UUIDField()
