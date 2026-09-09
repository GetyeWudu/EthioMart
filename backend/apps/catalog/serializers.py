from decimal import Decimal
from rest_framework import serializers
from apps.catalog.models import (
    Category,
    Brand,
    Attribute,
    AttributeValue,
    CategoryAttribute,
    Product,
    ProductAttributeValue,
    ProductVariant,
    ProductImage,
)
from apps.catalog.enums import ProductStatus, ProductType, AttributeType
from apps.inventory.models import WarehouseStock
from apps.promotions.services import PromotionService



class BrandSerializer(serializers.ModelSerializer):
    categories = serializers.SerializerMethodField(read_only=True)
    category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = Brand
        fields = ["id", "name", "name_am", "slug", "logo", "website", "is_verified", "categories", "category_ids"]
        extra_kwargs = {
            "logo": {"required": False, "allow_null": True},
            "name_am": {"required": False, "allow_blank": True, "default": ""},
            "slug": {"required": False, "allow_blank": True},
        }

    def get_categories(self, obj):
        return [
            {"id": str(c.id), "name": c.name, "slug": c.slug}
            for c in obj.categories.all()
        ]

    def create(self, validated_data):
        category_ids = validated_data.pop("category_ids", [])
        if not validated_data.get("slug"):
            import uuid
            from django.utils.text import slugify
            base_slug = slugify(validated_data["name"]) or f"brand-{uuid.uuid4().hex[:6]}"
            slug = base_slug
            if Brand.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
            validated_data["slug"] = slug
        brand = Brand.objects.create(**validated_data)
        if category_ids:
            from apps.catalog.models import Category as Cat
            cats = Cat.objects.filter(id__in=category_ids)
            brand.categories.set(cats)
        return brand

    def update(self, instance, validated_data):
        category_ids = validated_data.pop("category_ids", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if category_ids is not None:
            from apps.catalog.models import Category as Cat
            cats = Cat.objects.filter(id__in=category_ids)
            instance.categories.set(cats)
        return instance


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source="attribute.name", read_only=True)

    class Meta:
        model = AttributeValue
        fields = ["id", "value", "value_am", "color_code", "attribute_name", "is_global", "vendor"]


class AttributeSerializer(serializers.ModelSerializer):
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = Attribute
        fields = ["id", "name", "name_am", "attribute_type", "unit", "values"]


class AttributeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attribute
        fields = ["name", "name_am", "attribute_type", "unit"]


class CategoryAttributeSerializer(serializers.ModelSerializer):
    attribute = AttributeSerializer(read_only=True)

    class Meta:
        model = CategoryAttribute
        fields = [
            "id",
            "attribute",
            "is_required",
            "is_variant_creator",
            "is_filterable",
            "display_order",
        ]


class CategoryAttributeBindSerializer(serializers.Serializer):
    attribute_id = serializers.UUIDField()
    is_required = serializers.BooleanField(default=False)
    is_variant_creator = serializers.BooleanField(default=False)
    is_filterable = serializers.BooleanField(default=True)
    display_order = serializers.IntegerField(default=0)


class LeafCategorySerializer(serializers.ModelSerializer):
    full_path = serializers.SerializerMethodField()
    effective_commission_rate = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "name_am", "slug", "icon", "full_path", "effective_commission_rate"]

    def get_full_path(self, obj):
        try:
            ancestors = obj.get_ancestors()
            names = [a.name for a in ancestors] + [obj.name]
            return " > ".join(names)
        except Exception:
            return obj.name

    def get_effective_commission_rate(self, obj):
        from apps.catalog.services.commission_service import CommissionService
        return str(CommissionService.get_effective_category_commission(obj))


class CategoryDetailSerializer(serializers.ModelSerializer):
    is_leaf = serializers.BooleanField(read_only=True)
    category_attributes = CategoryAttributeSerializer(many=True, read_only=True)
    breadcrumbs = serializers.SerializerMethodField()
    effective_commission_rate = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "name_am",
            "slug",
            "icon",
            "image",
            "commission_rate_override",
            "effective_commission_rate",
            "is_active",
            "display_order",
            "is_leaf",
            "breadcrumbs",
            "category_attributes",
        ]

    def get_breadcrumbs(self, obj):
        ancestors = obj.get_ancestors()
        return [{"id": str(c.id), "name": c.name, "slug": c.slug} for c in ancestors]

    def get_effective_commission_rate(self, obj):
        from apps.catalog.services.commission_service import CommissionService
        return str(CommissionService.get_effective_category_commission(obj))


class CategoryCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    name_am = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    slug = serializers.SlugField(max_length=160, required=False, allow_blank=True)
    parent_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    icon = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    commission_rate_override = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        allow_null=True,
        default=None
    )
    display_order = serializers.IntegerField(default=0)


class AdminCategoryAttributeSerializer(serializers.ModelSerializer):
    category_path = serializers.SerializerMethodField()
    attribute_name = serializers.CharField(source='attribute.name', read_only=True)
    attribute_type = serializers.CharField(source='attribute.attribute_type', read_only=True)

    class Meta:
        model = CategoryAttribute
        fields = ['id', 'category', 'category_path', 'attribute', 'attribute_name', 'attribute_type', 'is_variant_creator', 'is_required', 'is_filterable', 'display_order']

    def get_category_path(self, obj):
        try:
            ancestors = obj.category.get_ancestors()
            names = [a.name for a in ancestors] + [obj.category.name]
            return " > ".join(names)
        except Exception:
            return obj.category.name


def _extract_clean_image_url(image_field):
    if not image_field:
        return None
    name = str(getattr(image_field, "name", "") or "")
    if "images.unsplash.com" in name:
        idx = name.find("images.unsplash.com")
        return f"https://{name[idx:]}"
    if name.startswith(("http://", "https://")):
        return name
    if "media/products/" in name:
        clean_path = name[name.find("media/products/"):]
        return f"https://res.cloudinary.com/gechexpress/image/upload/v1/{clean_path}"
    try:
        url = image_field.url
        if "images.unsplash.com" in url:
            idx = url.find("images.unsplash.com")
            return f"https://{url[idx:]}"
        if "media/products/" in url and not url.startswith("http"):
            clean_path = url[url.find("media/products/"):]
            return f"https://res.cloudinary.com/gechexpress/image/upload/v1/{clean_path}"
        if not url.startswith("http"):
            url = f"https://res.cloudinary.com/gechexpress/image/upload/v1/{url.lstrip('/')}"
        return url
    except Exception:
        if name:
            clean_name = name[name.find("media/products/"):] if "media/products/" in name else name.lstrip('/')
            return f"https://res.cloudinary.com/gechexpress/image/upload/v1/{clean_name}"
        return None


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "image_url", "alt_text", "display_order", "is_primary"]

    def get_image(self, obj):
        return self.get_image_url(obj)

    def get_image_url(self, obj):
        return _extract_clean_image_url(obj.image)


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source="attribute.name", read_only=True)
    value = serializers.SerializerMethodField()

    class Meta:
        model = ProductAttributeValue
        fields = ["id", "attribute", "attribute_name", "attribute_value", "custom_value", "value"]

    def get_value(self, obj):
        return obj.attribute_value.value if obj.attribute_value else obj.custom_value


class ProductVariantSerializer(serializers.ModelSerializer):
    attribute_values = AttributeValueSerializer(many=True, read_only=True)
    total_stock = serializers.SerializerMethodField()
    warehouse_stocks = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "barcode_upc",
            "price",
            "compare_at_price",
            "cost_price",
            "weight_kg",
            "attribute_values",
            "is_default",
            "is_active",
            "total_stock",
            "warehouse_stocks",
        ]

    def get_total_stock(self, obj):
        stocks = obj.warehouse_stocks.all()
        return sum(s.quantity_available for s in stocks)

    def get_warehouse_stocks(self, obj):
        return [
            {
                "warehouse_id": str(ws.warehouse.id),
                "warehouse_name": ws.warehouse.name,
                "warehouse_code": ws.warehouse.code,
                "quantity_on_hand": ws.quantity_on_hand,
                "quantity_reserved": ws.quantity_reserved,
                "quantity_available": ws.quantity_available,
                "is_pickup_point": ws.warehouse.is_pickup_point,
            }
            for ws in obj.warehouse_stocks.select_related("warehouse").all()
        ]


class ProductListSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.store_name", read_only=True)
    vendor_slug = serializers.CharField(source="vendor.slug", read_only=True)
    vendor_tier = serializers.CharField(source="vendor.tier", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True, default=None)
    can_be_hard_deleted = serializers.BooleanField(read_only=True)
    primary_image = serializers.SerializerMethodField()
    price_display = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    total_available_stock = serializers.SerializerMethodField()
    default_variant_id = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    effective_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    promotion_badge = serializers.SerializerMethodField()
    effective_commission_rate = serializers.SerializerMethodField()
    vendor_location = serializers.SerializerMethodField()
    can_be_hard_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "product_type",
            "status",
            "is_featured",
            "vendor_name",
            "vendor_slug",
            "vendor_tier",
            "vendor_location",
            "category_name",
            "category_slug",
            "brand_name",
            "primary_image",
            "price_display",
            "min_price",
            "max_price",
            "in_stock",
            "total_available_stock",
            "default_variant_id",
            "avg_rating",
            "review_count",
            "created_at",
            "original_price",
            "effective_price",
            "discount_percentage",
            "promotion_badge",
            "effective_commission_rate",
            "can_be_hard_deleted",
        ]

    def get_vendor_location(self, obj):
        if not getattr(obj, "vendor", None):
            return "Addis Ababa, Ethiopia"
        subcity = getattr(obj.vendor, "subcity", None)
        city = getattr(obj.vendor, "city", None) or "Addis Ababa"
        if subcity and subcity.strip() and subcity.lower() != city.lower():
            return f"{subcity}, {city}"
        return f"{city}, Ethiopia" if not city.lower().endswith("ethiopia") else city

    def get_effective_commission_rate(self, obj):
        from apps.catalog.services.commission_service import CommissionService
        return str(CommissionService.get_effective_commission_rate(product=obj))

    def _get_active_variants(self, obj):
        """Return active variants from prefetched cache — zero extra SQL."""
        return [v for v in obj.variants.all() if v.is_active]

    def get_default_variant_id(self, obj):
        # Scan prefetched variants in memory — no extra SQL
        variants = list(obj.variants.all())
        default_v = next((v for v in variants if getattr(v, "is_default", False)), None)
        if default_v is None and variants:
            default_v = variants[0]
        return str(default_v.id) if default_v else None

    def get_primary_image(self, obj):
        # Scan prefetched images in memory — no extra SQL
        images = list(obj.images.all())
        primary = next((img for img in images if img.is_primary), None) or (images[0] if images else None)
        if primary and primary.image:
            return _extract_clean_image_url(primary.image)
        return None

    def get_price_display(self, obj):
        prices = [v.price for v in self._get_active_variants(obj) if v.price is not None]
        if not prices:
            return "0.00 ETB"
        min_p, max_p = min(prices), max(prices)
        if min_p == max_p or obj.product_type == 'SIMPLE':
            return f"{min_p:,.2f} ETB"
        return f"{min_p:,.2f} - {max_p:,.2f} ETB"

    def get_original_price(self, obj):
        return self.get_min_price(obj)

    def _get_promo_data(self, obj):
        if not hasattr(self, '_promo_data_cache'):
            self._promo_data_cache = {}
        if obj.id not in self._promo_data_cache:
            active_promotions = self.context.get('active_promotions', [])
            base_price = Decimal(str(self.get_min_price(obj)))
            self._promo_data_cache[obj.id] = PromotionService.get_effective_discount(obj, active_promotions, base_price=base_price)
        return self._promo_data_cache[obj.id]

    def get_effective_price(self, obj):
        return float(self._get_promo_data(obj)['effective_price'])

    def get_discount_percentage(self, obj):
        return self._get_promo_data(obj)['discount_percentage']

    def get_promotion_badge(self, obj):
        return self._get_promo_data(obj)['promotion_badge']

    def get_min_price(self, obj):
        # In-memory scan over prefetched variants — no extra SQL
        prices = [v.price for v in self._get_active_variants(obj) if v.price is not None]
        return float(min(prices)) if prices else 0.0

    def get_max_price(self, obj):
        prices = [v.price for v in self._get_active_variants(obj) if v.price is not None]
        return float(max(prices)) if prices else 0.0

    def get_in_stock(self, obj):
        # In-memory scan over prefetched warehouse_stocks — no extra SQL
        for v in self._get_active_variants(obj):
            for ws in v.warehouse_stocks.all():
                if ws.quantity_available > 0:
                    return True
        return False

    def get_total_available_stock(self, obj):
        return sum(
            ws.quantity_available
            for v in self._get_active_variants(obj)
            for ws in v.warehouse_stocks.all()
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    vendor = serializers.SerializerMethodField()
    category = CategoryDetailSerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    specifications = ProductAttributeValueSerializer(many=True, read_only=True)
    price_display = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    effective_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    promotion_badge = serializers.SerializerMethodField()
    effective_commission_rate = serializers.SerializerMethodField()
    can_be_hard_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "description",
            "product_type",
            "status",
            "shipping_class",
            "length_cm",
            "width_cm",
            "height_cm",
            "rejection_reason",
            "is_featured",
            "warranty_period_days",
            "origin_country",
            "custom_specifications",
            "vendor",
            "category",
            "brand",
            "images",
            "variants",
            "specifications",
            "price_display",
            "min_price",
            "max_price",
            "avg_rating",
            "review_count",
            "created_at",
            "updated_at",
            "original_price",
            "effective_price",
            "discount_percentage",
            "promotion_badge",
            "effective_commission_rate",
            "can_be_hard_deleted",
        ]

    def get_effective_commission_rate(self, obj):
        from apps.catalog.services.commission_service import CommissionService
        return str(CommissionService.get_effective_commission_rate(product=obj))

    def get_vendor(self, obj):
        return {
            "id": str(obj.vendor.id),
            "store_name": obj.vendor.store_name,
            "slug": obj.vendor.slug,
            "tier": obj.vendor.tier,
            "is_verified": obj.vendor.is_verified,
            "logo": obj.vendor.store_logo.url if obj.vendor.store_logo else None,
            "city": obj.vendor.city,
        }

    def _get_active_variants(self, obj):
        """Return active variants from prefetched cache — zero extra SQL."""
        return [v for v in obj.variants.all() if v.is_active]

    def get_price_display(self, obj):
        prices = [v.price for v in self._get_active_variants(obj) if v.price is not None]
        if not prices:
            return "0.00 ETB"
        min_p, max_p = min(prices), max(prices)
        if min_p == max_p or obj.product_type == 'SIMPLE':
            return f"{min_p:,.2f} ETB"
        return f"{min_p:,.2f} - {max_p:,.2f} ETB"

    def get_original_price(self, obj):
        return self.get_min_price(obj)

    def _get_promo_data(self, obj):
        if not hasattr(self, '_promo_data_cache'):
            self._promo_data_cache = {}
        if obj.id not in self._promo_data_cache:
            active_promotions = self.context.get('active_promotions', [])
            base_price = Decimal(str(self.get_min_price(obj)))
            self._promo_data_cache[obj.id] = PromotionService.get_effective_discount(obj, active_promotions, base_price=base_price)
        return self._promo_data_cache[obj.id]

    def get_effective_price(self, obj):
        return float(self._get_promo_data(obj)['effective_price'])

    def get_discount_percentage(self, obj):
        return self._get_promo_data(obj)['discount_percentage']

    def get_promotion_badge(self, obj):
        return self._get_promo_data(obj)['promotion_badge']

    def get_min_price(self, obj):
        # In-memory scan over prefetched variants — no extra SQL
        prices = [v.price for v in self._get_active_variants(obj) if v.price is not None]
        return float(min(prices)) if prices else 0.0

    def get_max_price(self, obj):
        prices = [v.price for v in self._get_active_variants(obj) if v.price is not None]
        return float(max(prices)) if prices else 0.0


class ProductCreateSerializer(serializers.Serializer):
    category_id = serializers.UUIDField()
    suggested_category = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    brand_id = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True, default=None)
    new_brand_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    title = serializers.CharField(max_length=255)
    short_description = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    description = serializers.CharField()
    product_type = serializers.ChoiceField(choices=ProductType.choices, default=ProductType.SIMPLE)
    
    # Shipping & Dimensions
    shipping_class = serializers.CharField(max_length=20, required=False, default="STANDARD")
    length_cm = serializers.DecimalField(max_digits=6, decimal_places=1, required=False, default=15.0)
    width_cm = serializers.DecimalField(max_digits=6, decimal_places=1, required=False, default=10.0)
    height_cm = serializers.DecimalField(max_digits=6, decimal_places=1, required=False, default=5.0)
    weight_kg = serializers.DecimalField(max_digits=6, decimal_places=3, required=False, default=0.5)

    # For Simple Products:
    price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    compare_at_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    sku = serializers.CharField(max_length=100, required=False, allow_blank=True)
    initial_stock = serializers.IntegerField(default=0, required=False)
    warehouse_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    
    # Optional specifications
    specifications = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )
    custom_specifications = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        default=dict
    )
    
    # For Configurable Products
    variants = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )


class ProductRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5, max_length=1000)
