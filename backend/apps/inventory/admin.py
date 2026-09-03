from django.contrib import admin
from apps.inventory.models import (
    WarehouseLocation,
    WarehouseStock,
    StockMovement,
)


@admin.register(WarehouseLocation)
class WarehouseLocationAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "vendor", "city", "is_default", "is_pickup_point", "is_active"]
    list_filter = ["is_default", "is_pickup_point", "is_active", "city"]
    search_fields = ["name", "code", "vendor__store_name", "city"]


@admin.register(WarehouseStock)
class WarehouseStockAdmin(admin.ModelAdmin):
    list_display = ["variant", "warehouse", "quantity_on_hand", "quantity_reserved", "quantity_available", "low_stock_threshold"]
    list_filter = ["warehouse"]
    search_fields = ["variant__sku", "variant__product__title", "warehouse__name", "warehouse__code"]


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ["variant", "warehouse", "movement_type", "quantity_delta", "balance_after", "performed_by", "created_at"]
    list_filter = ["movement_type", "warehouse"]
    search_fields = ["variant__sku", "warehouse__name", "performed_by__email", "notes"]
    readonly_fields = ["created_at"]



