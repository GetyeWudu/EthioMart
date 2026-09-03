from rest_framework import serializers
from apps.carts.models import Cart, CartItem
from apps.catalog.models import Product, ProductVariant
from apps.catalog.serializers import AttributeValueSerializer, ProductImageSerializer
from apps.inventory.serializers import WarehouseLocationSerializer

class CartProductVariantLightSerializer(serializers.ModelSerializer):
    attribute_values = AttributeValueSerializer(many=True, read_only=True)
    stock = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'price', 'stock', 'attribute_values']

    def get_stock(self, obj):
        return sum(stock.quantity_available for stock in obj.warehouse_stocks.all())

class CartProductSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    variants = CartProductVariantLightSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'title', 'slug', 'vendor_name', 'images', 'category_name', 'variants']

class CartProductVariantSerializer(serializers.ModelSerializer):
    attribute_values = AttributeValueSerializer(many=True, read_only=True)
    product = CartProductSerializer(read_only=True)
    stock = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'price', 'stock', 'product', 'attribute_values']

    def get_stock(self, obj):
        return sum(stock.quantity_available for stock in obj.warehouse_stocks.all())

class CartItemSerializer(serializers.ModelSerializer):
    variant_details = CartProductVariantSerializer(source='variant', read_only=True)
    facility_details = WarehouseLocationSerializer(source='selected_facility', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'variant', 'quantity', 'selected_facility', 'variant_details', 'facility_details']
        read_only_fields = ['id']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    automatic_discount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'user', 'session_key', 'items', 'total_items', 'subtotal', 'automatic_discount']
        read_only_fields = ['id', 'user']

    def get_total_items(self, obj):
        return obj.get_total_items()

    def _get_cart_totals(self, obj):
        if hasattr(self, '_cart_totals_cache') and obj.id in self._cart_totals_cache:
            return self._cart_totals_cache[obj.id]

        from apps.promotions.models import Promotion
        from apps.promotions.services import PromotionService
        from django.db.models import Q
        from django.utils import timezone
        
        now = timezone.now()
        active_promotions = list(Promotion.objects.filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(expires_at__isnull=True) | Q(expires_at__gte=now),
            is_active=True,
            is_coupon_required=False
        ).prefetch_related('scope_products', 'scope_categories'))

        subtotal = 0
        automatic_discount = 0

        for item in obj.items.select_related('variant', 'variant__product'):
            unit_price = item.variant.price
            subtotal += unit_price * item.quantity
            
            promo_result = PromotionService.get_effective_discount(item.variant.product, active_promotions, base_price=unit_price)
            discount_amount = promo_result.get('discount_amount', 0)
            automatic_discount += discount_amount * item.quantity

        if not hasattr(self, '_cart_totals_cache'):
            self._cart_totals_cache = {}
            
        self._cart_totals_cache[obj.id] = {
            'subtotal': float(subtotal),
            'automatic_discount': float(automatic_discount)
        }
        return self._cart_totals_cache[obj.id]

    def get_subtotal(self, obj):
        return self._get_cart_totals(obj)['subtotal']

    def get_automatic_discount(self, obj):
        return self._get_cart_totals(obj)['automatic_discount']

