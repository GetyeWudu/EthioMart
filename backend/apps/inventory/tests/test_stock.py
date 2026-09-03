from decimal import Decimal
from django.test import TestCase
from apps.inventory.models import WarehouseLocation, WarehouseStock, StockMovement
from apps.inventory.services.inventory_service import InventoryService
from apps.inventory.enums import MovementType
from apps.catalog.models import Category, Product, ProductVariant
from apps.catalog.services.taxonomy_service import TaxonomyService
from apps.vendors.models import VendorProfile
from apps.users.models import CustomUser


class StockMovementAndLedgerTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="stock_manager@gechexpress.com",
            password="TestPassword123!",
            role=CustomUser.Role.SELLER,
        )
        self.vendor = VendorProfile.objects.create(
            user=self.user,
            store_name="Hawassa Distribution Hub",
            slug="hawassa-distribution-hub",
            city="Hawassa",
        )
        self.warehouse = self.vendor.warehouses.first()

        self.root_cat = TaxonomyService.create_root_category(name="Fashion")
        self.leaf_cat = TaxonomyService.create_child_category(parent=self.root_cat, name="Shoes")

        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="Leather Boots",
            slug="leather-boots",
            description="Genuine Ethiopian leather boots.",
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="SKU-BOOTS-42-BLK",
            price=Decimal("4500.00"),
        )

    def test_stock_adjustment_and_movement_ledger(self):
        # 1. Inward purchase receipt of 50 units
        stock = InventoryService.adjust_stock(
            warehouse=self.warehouse,
            variant=self.variant,
            quantity_delta=50,
            movement_type=MovementType.PURCHASE_RECEIPT,
            notes="Initial shipment from factory.",
        )
        self.assertEqual(stock.quantity_on_hand, 50)
        self.assertEqual(stock.quantity_available, 50)

        # Check ledger entry
        movement = StockMovement.objects.filter(variant=self.variant).first()
        self.assertIsNotNone(movement)
        self.assertEqual(movement.movement_type, MovementType.PURCHASE_RECEIPT)
        self.assertEqual(movement.quantity_delta, 50)
        self.assertEqual(movement.balance_after, 50)

        # 2. Damage write-off of 3 units
        stock = InventoryService.adjust_stock(
            warehouse=self.warehouse,
            variant=self.variant,
            quantity_delta=-3,
            movement_type=MovementType.DAMAGED_WRITE_OFF,
            notes="Water damage during storage.",
        )
        self.assertEqual(stock.quantity_on_hand, 47)
        self.assertEqual(StockMovement.objects.filter(variant=self.variant).count(), 2)

    def test_insufficient_stock_raises_error(self):
        with self.assertRaises(ValueError):
            InventoryService.adjust_stock(
                warehouse=self.warehouse,
                variant=self.variant,
                quantity_delta=-10,  # Negative adjustment on 0 stock
                movement_type=MovementType.ORDER_FULFILLMENT,
            )

    def test_inter_warehouse_stock_transfer(self):
        wh_adama = WarehouseLocation.objects.create(
            vendor=self.vendor,
            name="Adama Depot",
            code="WH-ADAMA-02",
            city="Adama",
            street_address="Depot St",
        )

        # Stock 100 units in Hawassa
        InventoryService.adjust_stock(
            warehouse=self.warehouse,
            variant=self.variant,
            quantity_delta=100,
            movement_type=MovementType.PURCHASE_RECEIPT,
        )

        # Transfer 30 units to Adama
        InventoryService.transfer_stock(
            source_warehouse=self.warehouse,
            target_warehouse=wh_adama,
            variant=self.variant,
            quantity=30,
            notes="Restocking Adama branch.",
        )

        # Hawassa should have 70, Adama should have 30
        stock_hawassa = WarehouseStock.objects.get(warehouse=self.warehouse, variant=self.variant)
        stock_adama = WarehouseStock.objects.get(warehouse=wh_adama, variant=self.variant)

        self.assertEqual(stock_hawassa.quantity_on_hand, 70)
        self.assertEqual(stock_adama.quantity_on_hand, 30)
