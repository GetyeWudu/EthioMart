import uuid
from decimal import Decimal
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from treebeard.mp_tree import MP_Node
from apps.common.models import BaseModel
from apps.catalog.enums import ProductStatus, ProductType, AttributeType
from apps.catalog.managers import ProductQuerySet
from apps.shipping.enums import ShippingClass


class Category(MP_Node, BaseModel):
    """
    Taxonomy hierarchy using Materialized Path (django-treebeard MP_Node).
    Provides O(1) subtree lookups, fast breadcrumbs, and hierarchical querying.
    """
    name = models.CharField(max_length=150)
    name_am = models.CharField(max_length=150, blank=True, help_text="Amharic translation")
    slug = models.SlugField(max_length=160, unique=True, db_index=True)
    icon = models.CharField(max_length=100, blank=True, help_text="Lucide icon name or CSS class")
    image = models.ImageField(upload_to="categories/%Y/%m/", null=True, blank=True)
    commission_rate_override = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional category-specific platform commission fee override (e.g. 8.00%)"
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    node_order_by = ["display_order", "name"]

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        indexes = [
            models.Index(fields=["slug", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} (Depth: {self.depth})"

    def is_leaf_node(self) -> bool:
        """Returns True if this category has no subcategories (terminal leaf node)."""
        return self.is_leaf()

    def clean(self):
        if not self.slug:
            self.slug = slugify(self.name)


class Brand(BaseModel):
    """
    Product brand (e.g. Apple, Samsung, Nike, Anbessa Shoe).
    """
    name = models.CharField(max_length=120, db_index=True)
    name_am = models.CharField(max_length=120, blank=True, default="", help_text="Amharic translation")
    slug = models.SlugField(max_length=140, unique=True, db_index=True)
    vendor = models.ForeignKey(
        "vendors.VendorProfile",
        null=True, blank=True,
        on_delete=models.CASCADE,
        related_name="custom_brands"
    )
    is_global = models.BooleanField(default=False)
    logo = models.ImageField(upload_to="brands/%Y/%m/", null=True, blank=True)
    website = models.URLField(max_length=255, blank=True)
    is_verified = models.BooleanField(default=False)
    categories = models.ManyToManyField(
        "Category",
        related_name="brands",
        blank=True,
        help_text="Root or branch categories where this brand is applicable."
    )

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                Lower('name'),
                condition=Q(vendor__isnull=True),
                name='unique_global_brand_lower'
            ),
            models.UniqueConstraint(
                Lower('name'), 'vendor',
                condition=Q(vendor__isnull=False),
                name='unique_vendor_brand_lower'
            )
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()
        super().save(*args, **kwargs)

    def clean(self):
        if not self.slug:
            self.slug = slugify(self.name)


class Attribute(BaseModel):
    """
    Dynamic attribute definition (e.g. 'RAM', 'Shoe Size', 'Color', 'Material').
    """
    name = models.CharField(max_length=100, unique=True)
    name_am = models.CharField(max_length=100, blank=True)
    attribute_type = models.CharField(
        max_length=20,
        choices=AttributeType.choices,
        default=AttributeType.SELECT
    )
    unit = models.CharField(max_length=30, blank=True, help_text="e.g., 'GB', 'cm', 'Watts'")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_attribute_type_display()})"


class AttributeValue(BaseModel):
    """
    Predefined or standardized option for an attribute (e.g. '16GB', 'Size 42', 'Midnight Black').
    """
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE,
        related_name="values"
    )
    value = models.CharField(max_length=100)
    value_am = models.CharField(max_length=100, blank=True)
    vendor = models.ForeignKey(
        "vendors.VendorProfile",
        null=True, blank=True,
        on_delete=models.CASCADE,
        related_name="custom_attribute_values"
    )
    is_global = models.BooleanField(default=False)
    color_code = models.CharField(
        max_length=7,
        blank=True,
        help_text="Hex code for visual color swatches (e.g. #000000)"
    )

    class Meta:
        ordering = ["attribute", "value"]
        constraints = [
            models.UniqueConstraint(
                'attribute', Lower('value'),
                condition=Q(vendor__isnull=True),
                name='unique_global_attr_val_lower'
            ),
            models.UniqueConstraint(
                'attribute', Lower('value'), 'vendor',
                condition=Q(vendor__isnull=False),
                name='unique_vendor_attr_val_lower'
            )
        ]

    def __str__(self):
        return f"{self.attribute.name}: {self.value}"

    def save(self, *args, **kwargs):
        if self.value:
            self.value = self.value.strip()
        super().save(*args, **kwargs)


class CategoryAttribute(BaseModel):
    """
    Bridge table binding dynamic attributes to specific categories.
    Determines whether an attribute generates SKU variants (Size, Color)
    or acts as descriptive specifications (RAM, Battery Capacity).
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="category_attributes"
    )
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE,
        related_name="bound_categories"
    )
    is_required = models.BooleanField(
        default=False,
        help_text="If True, seller must provide this attribute when submitting a listing."
    )
    is_variant_creator = models.BooleanField(
        default=False,
        help_text="If True, this attribute defines purchasable SKU variants (e.g., Size, Color)."
    )
    is_filterable = models.BooleanField(
        default=True,
        help_text="If True, shown on storefront facet search sidebar."
    )
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("category", "attribute")
        ordering = ["display_order", "attribute__name"]

    def __str__(self):
        variant_tag = " [Variant]" if self.is_variant_creator else " [Spec]"
        return f"{self.category.name} -> {self.attribute.name}{variant_tag}"


class Product(BaseModel):
    """
    Parent product definition. Bound exclusively to terminal leaf categories.
    """
    vendor = models.ForeignKey(
        "vendors.VendorProfile",
        on_delete=models.CASCADE,
        related_name="products"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products"
    )
    suggested_category = models.CharField(
        max_length=150, 
        blank=True, 
        help_text="Seller proposed subcategory if leaf is missing."
    )
    brand = models.ForeignKey(
        Brand,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products"
    )
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    short_description = models.CharField(max_length=500)
    description = models.TextField()
    product_type = models.CharField(
        max_length=30,
        choices=ProductType.choices,
        default=ProductType.SIMPLE
    )
    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.DRAFT,
        db_index=True
    )
    rejection_reason = models.TextField(blank=True)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    warranty_period_days = models.PositiveIntegerField(default=0)
    origin_country = models.CharField(max_length=100, default="Ethiopia")
    shipping_class = models.CharField(
        max_length=20,
        choices=ShippingClass.choices,
        default=ShippingClass.STANDARD,
        db_index=True,
    )
    length_cm = models.DecimalField(max_digits=6, decimal_places=1, default=Decimal("15.0"))
    width_cm = models.DecimalField(max_digits=6, decimal_places=1, default=Decimal("10.0"))
    height_cm = models.DecimalField(max_digits=6, decimal_places=1, default=Decimal("5.0"))
    custom_specifications = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Dynamic key-value pairs for unlisted or custom attributes."
    )

    def can_be_hard_deleted(self) -> bool:
        """
        Returns True ONLY if this product has never been ordered.
        """
        return not self.variants.filter(orderitem__isnull=False).exists()

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            # Covers status-filtered + date-sorted queries (e.g. moderation queue)
            models.Index(fields=["status", "-created_at"], name="idx_prod_status_created"),
            # Covers category-browse queries filtered by status + sorted by date
            models.Index(fields=["category", "status", "-created_at"], name="idx_prod_cat_stat_created"),
            # Covers vendor product lists filtered by status + sorted by date
            models.Index(fields=["vendor", "status", "-created_at"], name="idx_prod_vnd_stat_created"),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def clean(self):
        # Leaf Category Enforcement
        if self.category_id and hasattr(self.category, "is_leaf_node") and not self.category.is_leaf_node():
            raise ValidationError({
                "category": f"Products can only be assigned to terminal leaf categories. '{self.category.name}' has subcategories."
            })
        if not self.slug:
            base_slug = slugify(self.title) or f"product-{uuid.uuid4().hex[:8]}"
            self.slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"


class ProductAttributeValue(BaseModel):
    """
    Stores non-variant descriptive specifications for a product (e.g. Processor: Apple M3 Max).
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="specifications"
    )
    attribute = models.ForeignKey(
        Attribute,
        on_delete=models.CASCADE
    )
    attribute_value = models.ForeignKey(
        AttributeValue,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    custom_value = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("product", "attribute")

    def __str__(self):
        val = self.attribute_value.value if self.attribute_value else self.custom_value
        return f"{self.product.title} - {self.attribute.name}: {val}"


class ProductVariant(BaseModel):
    """
    The distinct purchasable SKU. Contains barcode, dimensions, and selling price.
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants"
    )
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    barcode_upc = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=3, default=Decimal("0.500"))
    attribute_values = models.ManyToManyField(
        AttributeValue,
        blank=True,
        related_name="product_variants"
    )
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-is_default", "price"]

    def __str__(self):
        return f"{self.product.title} - SKU: {self.sku} ({self.price} ETB)"

    def clean(self):
        if self.compare_at_price and self.compare_at_price <= self.price:
            raise ValidationError({
                "compare_at_price": "Compare-at price must be greater than the selling price."
            })


class ProductImage(BaseModel):
    """
    High-resolution product imagery and gallery items.
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )
    variant = models.ForeignKey(
        ProductVariant,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="images"
    )
    image = models.ImageField(upload_to="products/%Y/%m/")
    alt_text = models.CharField(max_length=200, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_primary", "display_order"]

    def __str__(self):
        return f"Image for {self.product.title} (Primary: {self.is_primary})"


class VendorStoreCollection(BaseModel):
    """
    Vendor-specific groupings for their custom storefronts (e.g. "Enkutatash Specials").
    Decoupled from global marketplace taxonomy.
    """
    vendor = models.ForeignKey(
        "vendors.VendorProfile", 
        related_name="store_collections", 
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180)
    banner_image = models.ImageField(upload_to="vendors/collections/", blank=True, null=True)
    products = models.ManyToManyField(Product, related_name="store_collections", blank=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        unique_together = ("vendor", "slug")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.vendor.store_name} - {self.title}"

    def clean(self):
        if not self.slug:
            self.slug = slugify(self.title)


class AdminAuditAlert(BaseModel):
    """
    Tracks suspicious product updates for field-level moderation.
    Avoids heavy revision tables by saving the diff payload directly.
    """
    class AlertType(models.TextChoices):
        PRICE_SURGE = "PRICE_SURGE", "Price Surge"
        MAJOR_CONTENT_EDIT = "MAJOR_CONTENT_EDIT", "Major Content Edit"
        PROBATION_SUBMISSION = "PROBATION_SUBMISSION", "Probation Submission"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="audit_alerts")
    seller = models.ForeignKey("vendors.VendorProfile", on_delete=models.CASCADE, related_name="audit_alerts")
    alert_type = models.CharField(max_length=50, choices=AlertType.choices)
    diff_payload = models.JSONField(help_text="Detailed JSON showing old vs new values")
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        "users.CustomUser", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="resolved_audit_alerts"
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_resolved", "alert_type"]),
            models.Index(fields=["seller", "is_resolved"]),
        ]

    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.product.title} (Resolved: {self.is_resolved})"
