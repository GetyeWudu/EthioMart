from django.contrib import admin
from django.utils import timezone
from .models import Order, VendorSubOrder, OrderItem
from apps.vendors.services.wallet_service import WalletService


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("unit_price", "status")


class VendorSubOrderInline(admin.StackedInline):
    model = VendorSubOrder
    extra = 0
    readonly_fields = ("vendor", "sub_total", "shipping_fee", "dispatched_at", "delivered_at", "is_payout_settled")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "customer", "total_amount", "payment_status", "created_at")
    list_filter = ("payment_status", "created_at")
    search_fields = ("order_number", "transaction_reference", "customer__email")
    readonly_fields = ("created_at", "updated_at")
    inlines = [VendorSubOrderInline]


@admin.register(VendorSubOrder)
class VendorSubOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "vendor",
        "sub_total",
        "derived_status",
        "delivered_at",
        "is_payout_settled",
        "created_at",
    )
    list_filter = ("is_payout_settled", "is_disputed", "created_at")
    search_fields = ("id", "order__order_number", "vendor__store_name")
    readonly_fields = ("created_at", "updated_at")
    actions = ["mark_as_delivered", "settle_escrow_immediately"]
    inlines = [OrderItemInline]

    @admin.action(description="Mark selected sub-orders as DELIVERED (starts escrow window)")
    def mark_as_delivered(self, request, queryset):
        count = 0
        for sub_order in queryset:
            sub_order.items.exclude(status="CANCELLED").update(status="DELIVERED")
            sub_order.delivered_at = timezone.now()
            sub_order.save(update_fields=["delivered_at"])
            count += 1
        self.message_user(request, f"Marked {count} sub-orders as DELIVERED.")

    @admin.action(description="Settle escrow to available balance IMMEDIATELY")
    def settle_escrow_immediately(self, request, queryset):
        settled = 0
        for sub_order in queryset:
            if not sub_order.delivered_at:
                sub_order.items.exclude(status="CANCELLED").update(status="DELIVERED")
                sub_order.delivered_at = timezone.now()
                sub_order.save(update_fields=["delivered_at"])
            result = WalletService.settle_payout(sub_order)
            if result:
                settled += 1
        self.message_user(request, f"Successfully settled {settled} sub-orders into seller available balances.")
