from django.contrib import admin
from treebeard.admin import TreeAdmin
from treebeard.forms import movenodeform_factory
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


@admin.register(Category)
class CategoryAdmin(TreeAdmin):
    form = movenodeform_factory(Category)
    list_display = ["name", "slug", "depth", "is_active", "display_order", "commission_rate_override"]
    list_filter = ["is_active", "depth"]
    search_fields = ["name", "name_am", "slug"]


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_verified", "created_at"]
    list_filter = ["is_verified"]
    search_fields = ["name", "slug"]


class AttributeValueInline(admin.TabularInline):
    model = AttributeValue
    extra = 1


@admin.register(Attribute)
class AttributeAdmin(admin.ModelAdmin):
    list_display = ["name", "name_am", "attribute_type", "unit"]
    list_filter = ["attribute_type"]
    search_fields = ["name", "name_am"]
    inlines = [AttributeValueInline]


@admin.register(CategoryAttribute)
class CategoryAttributeAdmin(admin.ModelAdmin):
    list_display = ["category", "attribute", "is_required", "is_variant_creator", "is_filterable", "display_order"]
    list_filter = ["is_required", "is_variant_creator", "is_filterable"]
    search_fields = ["category__name", "attribute__name"]


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductAttributeValueInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title", "vendor", "category", "brand", "product_type", "status", "is_featured", "created_at"]
    list_filter = ["status", "product_type", "is_featured", "category"]
    search_fields = ["title", "slug", "vendor__store_name", "vendor__user__email"]
    inlines = [ProductImageInline, ProductVariantInline, ProductAttributeValueInline]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ["sku", "product", "price", "compare_at_price", "is_default", "is_active"]
    list_filter = ["is_default", "is_active"]
    search_fields = ["sku", "barcode_upc", "product__title"]
