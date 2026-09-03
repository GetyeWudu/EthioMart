import uuid
from decimal import Decimal
from django.test import TestCase
from django.core.cache import cache
from apps.inventory.models import WarehouseLocation, WarehouseStock, StockMovement
from apps.inventory.services.inventory_service import InventoryService
from apps.inventory.services.reservation_service import StockReservationService
from apps.inventory.enums import MovementType
from apps.catalog.models import Category, Product, ProductVariant
from apps.catalog.services.taxonomy_service import TaxonomyService
from apps.vendors.models import VendorProfile
from apps.users.models import CustomUser


class StockReservationConcurrencyTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = CustomUser.objects.create_user(
            email="checkout_seller@gechexpress.com",
            password="TestPassword123!",
            role=CustomUser.Role.SELLER,
        )
        self.vendor = VendorProfile.objects.create(
            user=self.user,
            store_name="Dire Dawa Direct",
            slug="dire-dawa-direct",
            city="Dire Dawa",
        )
        self.warehouse = self.vendor.warehouses.first()

        self.root_cat = TaxonomyService.create_root_category(name="Gadgets")
        self.leaf_cat = TaxonomyService.create_child_category(parent=self.root_cat, name="Smartwatches")

        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="Fitness Watch Pro",
            slug="fitness-watch-pro",
            description="Smartwatch with heart rate monitor.",
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="SKU-WATCH-PRO-01",
            price=Decimal("8900.00"),
        )

        # Stock exactly 5 units
        InventoryService.adjust_stock(
            warehouse=self.warehouse,
            variant=self.variant,
            quantity_delta=5,
            movement_type=MovementType.PURCHASE_RECEIPT,
        )

    def test_stock_reservation_flow(self):
        cart_1 = str(uuid.uuid4())
        cart_2 = str(uuid.uuid4())

        # Customer 1 reserves 3 units
        res_1 = StockReservationService.reserve_stock(
            cart_id=cart_1,
            variant=self.variant,
            warehouse=self.warehouse,
            quantity=3,
        )
        self.assertTrue(res_1)

        stock = WarehouseStock.objects.get(warehouse=self.warehouse, variant=self.variant)
        self.assertEqual(stock.quantity_on_hand, 5)
        self.assertEqual(stock.quantity_reserved, 3)
        self.assertEqual(stock.quantity_available, 2)

        # Customer 2 attempts to reserve 3 units (only 2 available) -> Must fail
        res_2 = StockReservationService.reserve_stock(
            cart_id=cart_2,
            variant=self.variant,
            warehouse=self.warehouse,
            quantity=3,
        )
        self.assertFalse(res_2)

        # Customer 1 abandons checkout -> Release reservation
        StockReservationService.release_reservation(
            cart_id=cart_1,
            variant=self.variant,
            warehouse=self.warehouse,
            quantity=3,
        )

        stock.refresh_from_db()
        self.assertEqual(stock.quantity_reserved, 0)
        self.assertEqual(stock.quantity_available, 5)

    def test_order_fulfillment_after_reservation(self):
        cart_id = str(uuid.uuid4())
        order_id = uuid.uuid4()

        # 1. Reserve 2 units
        StockReservationService.reserve_stock(
            cart_id=cart_id,
            variant=self.variant,
            warehouse=self.warehouse,
            quantity=2,
        )

        # 2. Payment confirmed -> Fulfill reservation
        stock = StockReservationService.fulfill_reservation(
            cart_id=cart_id,
            variant=self.variant,
            warehouse=self.warehouse,
            quantity=2,
            order_id=order_id,
        )

        self.assertEqual(stock.quantity_on_hand, 3)
        self.assertEqual(stock.quantity_reserved, 0)
        self.assertEqual(stock.quantity_available, 3)

        # Verify fulfillment movement recorded in audit ledger
        movement = StockMovement.objects.filter(
            variant=self.variant,
            movement_type=MovementType.ORDER_FULFILLMENT
        ).first()
        self.assertIsNotNone(movement)
        self.assertEqual(movement.quantity_delta, -2)
        self.assertEqual(movement.balance_after, 3)
        self.assertEqual(movement.reference_order_id, order_id)
