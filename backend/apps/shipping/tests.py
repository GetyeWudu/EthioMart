from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.vendors.models import VendorProfile
from apps.catalog.models import Category, Product, ProductVariant
from apps.shipping.models import ShippingZone, ShippingZoneRate
from apps.shipping.enums import ShippingClass
from apps.shipping.services import ShippingCalculator

User = get_user_model()


class ShippingCalculatorTests(TestCase):
    def setUp(self):
        # 1. Create Sellers
        self.seller_user_a = User.objects.create_user(
            email="seller_a@gechexpress.com",
            password="Password123!",
            role="SELLER"
        )
        self.vendor_a = VendorProfile.objects.create(
            user=self.seller_user_a,
            store_name="Addis Fashion Hub",
            slug="addis-fashion-hub"
        )

        self.seller_user_b = User.objects.create_user(
            email="seller_b@gechexpress.com",
            password="Password123!",
            role="SELLER"
        )
        self.vendor_b = VendorProfile.objects.create(
            user=self.seller_user_b,
            store_name="Gondar Furniture Co",
            slug="gondar-furniture-co"
        )

        # 2. Category
        self.category = Category.add_root(name="General Goods", slug="general-goods")

        # 3. Zone & Rates for Amhara & Addis-C
        self.zone_amhara = ShippingZone.objects.create(code="AMHARA", name="Amhara Region", is_active=True)
        ShippingZoneRate.objects.create(
            zone=self.zone_amhara,
            shipping_class=ShippingClass.STANDARD,
            base_fee=Decimal("120.00"),
            per_kg_rate=Decimal("18.00"),
            estimated_days_min=3,
            estimated_days_max=4,
        )
        ShippingZoneRate.objects.create(
            zone=self.zone_amhara,
            shipping_class=ShippingClass.BULKY,
            base_fee=Decimal("1000.00"),
            per_kg_rate=Decimal("50.00"),
            estimated_days_min=6,
            estimated_days_max=8,
        )

        self.zone_addis = ShippingZone.objects.create(code="ADDIS-C", name="Addis Ababa - Central", is_active=True)
        ShippingZoneRate.objects.create(
            zone=self.zone_addis,
            shipping_class=ShippingClass.STANDARD,
            base_fee=Decimal("50.00"),
            per_kg_rate=Decimal("10.00"),
            estimated_days_min=1,
            estimated_days_max=1,
        )

        # 4. Products
        # T-Shirt: 0.3 kg, 20x15x2 cm (vol = 600/5000 = 0.12 kg -> chargeable = 0.3 kg)
        self.tshirt_product = Product.objects.create(
            vendor=self.vendor_a,
            category=self.category,
            title="Graphic T-Shirt",
            slug="graphic-t-shirt",
            shipping_class=ShippingClass.STANDARD,
            length_cm=Decimal("20.0"),
            width_cm=Decimal("15.0"),
            height_cm=Decimal("2.0"),
            status="ACTIVE"
        )
        self.tshirt_variant = ProductVariant.objects.create(
            product=self.tshirt_product,
            sku="TSHIRT-M",
            price=Decimal("450.00"),
            weight_kg=Decimal("0.300")
        )

        # Pillow: 0.2 kg, 50x40x30 cm (vol = 60000/5000 = 12 kg -> chargeable = 12 kg)
        self.pillow_product = Product.objects.create(
            vendor=self.vendor_a,
            category=self.category,
            title="Cotton Fluff Pillow",
            slug="cotton-fluff-pillow",
            shipping_class=ShippingClass.STANDARD,
            length_cm=Decimal("50.0"),
            width_cm=Decimal("40.0"),
            height_cm=Decimal("30.0"),
            status="ACTIVE"
        )
        self.pillow_variant = ProductVariant.objects.create(
            product=self.pillow_product,
            sku="PILLOW-STD",
            price=Decimal("350.00"),
            weight_kg=Decimal("0.200")
        )

        # Sofa: 70 kg, 120x80x90 cm (vol = 864000/5000 = 172.8 kg -> chargeable = 172.8 kg)
        self.sofa_product = Product.objects.create(
            vendor=self.vendor_b,
            category=self.category,
            title="Modern 3-Seater Sofa",
            slug="modern-3-seater-sofa",
            shipping_class=ShippingClass.BULKY,
            length_cm=Decimal("120.0"),
            width_cm=Decimal("80.0"),
            height_cm=Decimal("90.0"),
            status="ACTIVE"
        )
        self.sofa_variant = ProductVariant.objects.create(
            product=self.sofa_product,
            sku="SOFA-3S",
            price=Decimal("45000.00"),
            weight_kg=Decimal("70.000")
        )

        # Digital Product
        self.ebook_product = Product.objects.create(
            vendor=self.vendor_a,
            category=self.category,
            title="Software Engineering E-Book",
            slug="swe-ebook",
            shipping_class=ShippingClass.DIGITAL,
            length_cm=Decimal("0.0"),
            width_cm=Decimal("0.0"),
            height_cm=Decimal("0.0"),
            status="ACTIVE"
        )
        self.ebook_variant = ProductVariant.objects.create(
            product=self.ebook_product,
            sku="EBOOK-DIGITAL",
            price=Decimal("150.00"),
            weight_kg=Decimal("0.000")
        )

    def test_single_tshirt_shipping(self):
        """Single t-shirt to Amhara: base 120 + (0.3 * 18 = 5.40) = 125.40 ETB"""
        cart_items = [{"variant": str(self.tshirt_variant.id), "quantity": 1}]
        res = ShippingCalculator.calculate(cart_items, self.zone_amhara.id)
        self.assertEqual(res["total_shipping_fee"], Decimal("125.40"))
        self.assertEqual(res["n_vendors"], 1)
        self.assertEqual(res["sub_orders"][0]["pkg_chargeable_weight_kg"], 0.3)

    def test_multi_quantity_same_vendor_single_base_fee(self):
        """5 t-shirts from same vendor: base 120 + (5 * 0.3 * 18 = 27.00) = 147.00 ETB"""
        cart_items = [{"variant": str(self.tshirt_variant.id), "quantity": 5}]
        res = ShippingCalculator.calculate(cart_items, self.zone_amhara.id)
        self.assertEqual(res["total_shipping_fee"], Decimal("147.00"))
        self.assertEqual(res["sub_orders"][0]["base_fee"], Decimal("120.00"))
        self.assertEqual(res["sub_orders"][0]["weight_fee"], Decimal("27.00"))

    def test_volumetric_weight_pillow(self):
        """Pillow: Volumetric weight (12kg) exceeds actual weight (0.2kg). Fee = 120 + (12 * 18) = 336.00 ETB"""
        cart_items = [{"variant": str(self.pillow_variant.id), "quantity": 1}]
        res = ShippingCalculator.calculate(cart_items, self.zone_amhara.id)
        self.assertEqual(res["total_shipping_fee"], Decimal("336.00"))
        self.assertEqual(res["sub_orders"][0]["pkg_chargeable_weight_kg"], 12.0)

    def test_bulky_sofa_shipping(self):
        """Sofa: Bulky class rate. Volumetric weight 172.8kg > actual 70kg. Fee = 1000 + (172.8 * 50) = 9640.00 ETB"""
        cart_items = [{"variant": str(self.sofa_variant.id), "quantity": 1}]
        res = ShippingCalculator.calculate(cart_items, self.zone_amhara.id)
        self.assertEqual(res["total_shipping_fee"], Decimal("9640.00"))
        self.assertEqual(res["sub_orders"][0]["shipping_class"], ShippingClass.BULKY)

    def test_multi_vendor_package_aggregation(self):
        """Cart with items from Vendor A and Vendor B: Each vendor gets independent sub-order fee, summed together."""
        cart_items = [
            {"variant": str(self.tshirt_variant.id), "quantity": 1},  # Vendor A: 125.40 ETB
            {"variant": str(self.sofa_variant.id), "quantity": 1},    # Vendor B: 9640.00 ETB
        ]
        res = ShippingCalculator.calculate(cart_items, self.zone_amhara.id)
        self.assertEqual(res["n_vendors"], 2)
        self.assertEqual(res["total_shipping_fee"], Decimal("9765.40"))
        self.assertEqual(len(res["sub_orders"]), 2)

    def test_digital_product_zero_shipping(self):
        """Digital products have 0.00 shipping fee."""
        cart_items = [{"variant": str(self.ebook_variant.id), "quantity": 2}]
        res = ShippingCalculator.calculate(cart_items, self.zone_amhara.id)
        self.assertEqual(res["total_shipping_fee"], Decimal("0.00"))
        self.assertEqual(res["sub_orders"][0]["sub_order_shipping_fee"], Decimal("0.00"))
