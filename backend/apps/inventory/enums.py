from django.db import models


class MovementType(models.TextChoices):
    PURCHASE_RECEIPT = "PURCHASE_RECEIPT", "Inward Stock Purchase Receipt"
    ORDER_FULFILLMENT = "ORDER_FULFILLMENT", "Outward Customer Order Fulfillment"
    ORDER_CANCELLED_RESTOCK = "ORDER_CANCELLED_RESTOCK", "Order Cancellation Restock"
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT", "Manual Inventory Audit Adjustment"
    DAMAGED_WRITE_OFF = "DAMAGED_WRITE_OFF", "Damaged / Expired Inventory Write-Off"
    TRANSFER_IN = "TRANSFER_IN", "Inter-Warehouse Transfer In"
    TRANSFER_OUT = "TRANSFER_OUT", "Inter-Warehouse Transfer Out"


class StaffRole(models.TextChoices):
    STORE_ADMIN = "STORE_ADMIN", "Store / Organization Administrator"
    HUB_MANAGER = "HUB_MANAGER", "Warehouse / Hub Branch Manager"
    INVENTORY_CLERK = "INVENTORY_CLERK", "Inventory Clerk / Stock Counter"
    DISPATCHER = "DISPATCHER", "Fulfillment & Pack/Ship Dispatcher"
    FINANCE_VIEWER = "FINANCE_VIEWER", "Read-Only Financial Auditor"
