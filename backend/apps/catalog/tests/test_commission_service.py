"""
apps/catalog/tests/test_commission_service.py
============================================
Unit tests for CommissionService:
  - Level 1 Root Category inheritance
  - Multi-level subcategory inheritance
  - Subcategory specific overrides
  - Fallback to Global Platform Setting
  - Platform Direct Store 0.00% rate
  - Vendor custom rate overrides
  - Decimal monetary calculations
"""

from decimal import Decimal
from django.test import TestCase
from apps.catalog.models import Category, Product, ProductVariant
from apps.catalog.enums import ProductType
from apps.catalog.services.commission_service import CommissionService
from apps.core_settings.models import PlatformSetting
from apps.core_settings.services import SettingsService
from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile
from apps.vendors.enums import VendorType


class CommissionServiceTest(TestCase):
    def setUp(self):
        # Create Global Base Commission setting
        SettingsService.set(
            key="base_commission_rate",
            value="10.00",
            description="Platform baseline commission",
            value_type=PlatformSetting.ValueType.DECIMAL,
        )

        # Create Seller User and Vendor Profile
        self.seller_user = CustomUser.objects.create_user(
            email="seller_comm@test.com",
            password="TestPassword123!",
            first_name="Abebe",
            last_name="Bikila",
            role=CustomUser.Role.SELLER,
        )
        self.vendor = VendorProfile.objects.create(
            user=self.seller_user,
            store_name="Abebe Sports",
            commission_rate=Decimal("10.00"),
        )

        # Create Platform Store
        self.platform_user = CustomUser.objects.create_user(
            email="platform_admin@test.com",
            password="TestPassword123!",
            first_name="Platform",
            last_name="Store",
            role=CustomUser.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
        )
        self.platform_vendor = VendorProfile.objects.create(
            user=self.platform_user,
            store_name="GechExpress Direct Store",
            vendor_type=VendorType.PLATFORM,
            commission_rate=Decimal("0.00"),
        )

        # Build Category Hierarchy using treebeard MP_Node
        # Root (Level 1): Electronics (Override = 6.00%)
        self.root_electronics = Category.add_root(
            name="Electronics",
            slug="electronics",
            commission_rate_override=Decimal("6.00"),
        )
        # Child (Level 2): Phones (Override = None -> Inherits 6.00%)
        self.child_phones = self.root_electronics.add_child(
            name="Smartphones",
            slug="smartphones",
            commission_rate_override=None,
        )
        # Grandchild (Level 3): Phone Accessories (Override = 12.00% -> Overrides to 12.00%)
        self.grandchild_accessories = self.child_phones.add_child(
            name="Phone Cases & Covers",
            slug="phone-cases-covers",
            commission_rate_override=Decimal("12.00"),
        )

        # Root (Level 1): Fashion (Override = None -> Inherits Global Base 10.00%)
        self.root_fashion = Category.add_root(
            name="Fashion & Apparel",
            slug="fashion-apparel",
            commission_rate_override=None,
        )
        # Child (Level 2): Men's Clothing (Override = None -> Inherits Global Base 10.00%)
        self.child_mens = self.root_fashion.add_child(
            name="Men's Clothing",
            slug="mens-clothing",
            commission_rate_override=None,
        )

    def test_root_category_override(self):
        rate = CommissionService.get_effective_category_commission(self.root_electronics)
        self.assertEqual(rate, Decimal("6.00"))

    def test_level_2_inherits_from_level_1_root(self):
        # Smartphones has commission_rate_override=None, should inherit 6.00% from Electronics
        rate = CommissionService.get_effective_category_commission(self.child_phones)
        self.assertEqual(rate, Decimal("6.00"))

    def test_level_3_specific_override_takes_precedence(self):
        # Phone Accessories has explicit 12.00%, overriding ancestor's 6.00%
        rate = CommissionService.get_effective_category_commission(self.grandchild_accessories)
        self.assertEqual(rate, Decimal("12.00"))

    def test_unconfigured_categories_fallback_to_global_setting(self):
        # Fashion has no override, should fallback to global 10.00%
        rate = CommissionService.get_effective_category_commission(self.root_fashion)
        self.assertEqual(rate, Decimal("10.00"))

        # Men's Clothing also has no override, should fallback to global 10.00%
        rate_child = CommissionService.get_effective_category_commission(self.child_mens)
        self.assertEqual(rate_child, Decimal("10.00"))

    def test_changing_global_setting_updates_fallback_dynamically(self):
        # Admin changes global baseline from 10.00% to 8.50%
        SettingsService.set("base_commission_rate", "8.50", value_type=PlatformSetting.ValueType.DECIMAL)

        rate = CommissionService.get_effective_category_commission(self.child_mens)
        self.assertEqual(rate, Decimal("8.50"))

    def test_platform_direct_store_always_zero_commission(self):
        product = Product.objects.create(
            vendor=self.platform_vendor,
            category=self.grandchild_accessories,  # Has 12% category rate
            title="Gech Brand Phone Case",
            description="Official Gech Case",
            product_type=ProductType.SIMPLE,
        )
        rate = CommissionService.get_effective_commission_rate(product=product)
        self.assertEqual(rate, Decimal("0.00"))

    def test_vendor_custom_commission_override_when_category_has_no_override(self):
        # Vendor given VIP 5.00% rate
        self.vendor.commission_rate = Decimal("5.00")
        self.vendor.save()

        product = Product.objects.create(
            vendor=self.vendor,
            category=self.child_mens,  # Has no category override
            title="Men's Wool Jacket",
            description="Warm jacket",
            product_type=ProductType.SIMPLE,
        )
        rate = CommissionService.get_effective_commission_rate(product=product)
        self.assertEqual(rate, Decimal("5.00"))

    def test_calculate_commission_monetary_math(self):
        # Product in Electronics (6.00%) selling for 2,500.00 ETB
        product = Product.objects.create(
            vendor=self.vendor,
            category=self.child_phones,
            title="Galaxy Smartphone",
            description="Phone",
            product_type=ProductType.SIMPLE,
        )
        rate, deduction = CommissionService.calculate_commission(
            gross_amount=Decimal("2500.00"),
            product=product,
        )
        self.assertEqual(rate, Decimal("6.00"))
        # 2500 * 0.06 = 150.00 ETB
        self.assertEqual(deduction, Decimal("150.00"))
