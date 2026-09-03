from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.exceptions import ValidationError

from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile, VendorWallet
from apps.vendors.enums import VendorStatus, BusinessType
from apps.catalog.models import Category, Brand, Product, ProductVariant
from apps.catalog.enums import ProductStatus
from apps.carts.models import Cart, CartItem
from apps.orders.services.checkout_service import CheckoutService
from apps.inventory.models import WarehouseLocation, WarehouseStock


class SuspendedOperatingStandardTests(APITestCase):
    def setUp(self):
        # 1. Active Customer & Suspended Customer
        self.active_customer = CustomUser.objects.create_user(
            email="active.buyer@gechexpress.com",
            password="Password123!",
            first_name="Active",
            last_name="Buyer",
            role=CustomUser.Role.CUSTOMER,
            is_active=True,
        )
        self.suspended_customer = CustomUser.objects.create_user(
            email="suspended.buyer@gechexpress.com",
            password="Password123!",
            first_name="Suspended",
            last_name="Buyer",
            role=CustomUser.Role.CUSTOMER,
            is_active=False,
        )

        # 2. Seller User & Vendor Profile
        self.seller_user = CustomUser.objects.create_user(
            email="test.seller@gechexpress.com",
            password="Password123!",
            first_name="Store",
            last_name="Owner",
            role=CustomUser.Role.SELLER,
            is_active=True,
        )
        self.vendor = VendorProfile.objects.create(
            user=self.seller_user,
            store_name="Super Store",
            business_type=BusinessType.INDIVIDUAL,
            status=VendorStatus.APPROVED,
        )
        self.wallet = VendorWallet.objects.create(
            vendor=self.vendor,
            available_balance=Decimal("5000.00"),
            is_payout_locked=False,
        )

        # 3. Category, Brand, Product & Stock
        self.category = Category.add_root(name="Electronics", slug="electronics")
        self.leaf_cat = self.category.add_child(name="Smartphones", slug="smartphones")

        self.brand = Brand.objects.create(name="TechBrand", slug="techbrand")
        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.leaf_cat,
            brand=self.brand,
            title="Flagship Smartphone Pro",
            slug="flagship-smartphone-pro",
            status=ProductStatus.ACTIVE,
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="PHONE-PRO-BLK",
            price=Decimal("25000.00"),
        )
        self.warehouse = WarehouseLocation.objects.create(
            vendor=self.vendor,
            name="Main Hub",
            city="Addis Ababa",
        )
        self.stock = WarehouseStock.objects.create(
            warehouse=self.warehouse,
            variant=self.variant,
            quantity_on_hand=10,
            quantity_reserved=0,
        )

        # 4. Cart with item
        self.cart = Cart.objects.create(user=self.active_customer)
        self.cart_item = CartItem.objects.create(
            cart=self.cart,
            variant=self.variant,
            quantity=1,
        )

    def test_dynamic_storefront_delisting_zero_write(self):
        # 1. Product is visible when vendor is APPROVED
        self.assertTrue(Product.objects.live_on_storefront().filter(id=self.product.id).exists())

        # 2. Suspend Vendor -> Product immediately disappears with 0 DB writes on Product
        self.vendor.status = VendorStatus.SUSPENDED
        self.vendor.save()

        self.assertFalse(Product.objects.live_on_storefront().filter(id=self.product.id).exists())
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, ProductStatus.ACTIVE)  # Untouched in DB

        # 3. Reinstate Vendor -> Product immediately reappears
        self.vendor.status = VendorStatus.APPROVED
        self.vendor.save()
        self.assertTrue(Product.objects.live_on_storefront().filter(id=self.product.id).exists())

    def test_signal_syncs_payout_lock_on_suspension_and_reinstatement(self):
        self.assertFalse(self.vendor.wallet.is_payout_locked)

        # Suspend vendor
        self.vendor.status = VendorStatus.SUSPENDED
        self.vendor.save()
        self.vendor.wallet.refresh_from_db()
        self.assertTrue(self.vendor.wallet.is_payout_locked)
        self.assertIn("suspended", self.vendor.wallet.lock_reason.lower())

        # Reinstate vendor
        self.vendor.status = VendorStatus.APPROVED
        self.vendor.save()
        self.vendor.wallet.refresh_from_db()
        self.assertFalse(self.vendor.wallet.is_payout_locked)

    def test_suspended_customer_blocked_from_checkout(self):
        with self.assertRaises(ValidationError) as ctx:
            CheckoutService.process_checkout(
                user=self.suspended_customer,
                cart_id=self.cart.id,
            )
        self.assertIn("purchasing privileges are suspended", str(ctx.exception).lower())

    def test_cart_item_rejected_if_vendor_is_suspended(self):
        # Suspend vendor
        self.vendor.status = VendorStatus.SUSPENDED
        self.vendor.save()

        with self.assertRaises(ValidationError) as ctx:
            CheckoutService.process_checkout(
                user=self.active_customer,
                cart_id=self.cart.id,
            )
        self.assertIn("no longer available from the merchant", str(ctx.exception))

    def test_suspended_seller_cannot_create_products(self):
        self.client.force_authenticate(user=self.seller_user)
        self.vendor.status = VendorStatus.SUSPENDED
        self.vendor.save()

        response = self.client.post("/api/v1/catalog/seller/products/", {
            "title": "New Forbidden Phone",
            "category_id": str(self.leaf_cat.id),
            "short_description": "Short description",
            "description": "Full description",
            "variants_data": [{"price": "1000.00", "weight_kg": "0.5"}],
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("approved", response.data.get("error", "").lower())

    def test_unapproved_kyc_seller_cannot_create_products(self):
        self.client.force_authenticate(user=self.seller_user)
        self.vendor.status = VendorStatus.PENDING_REVIEW
        self.vendor.save()

        response = self.client.post("/api/v1/catalog/seller/products/", {
            "title": "New Unapproved Phone",
            "category_id": str(self.leaf_cat.id),
            "short_description": "Short description",
            "description": "Full description",
            "variants_data": [{"price": "1000.00", "weight_kg": "0.5"}],
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("approved", response.data.get("error", "").lower())

    def test_suspended_customer_cannot_add_to_cart(self):
        self.client.force_authenticate(user=self.suspended_customer)
        response = self.client.post("/api/v1/carts/items/", {
            "variant": str(self.variant.id),
            "quantity": 1,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("suspended", response.data.get("detail", "").lower())

    def test_suspended_customer_cannot_toggle_wishlist(self):
        self.client.force_authenticate(user=self.suspended_customer)
        response = self.client.post("/api/v1/wishlists/toggle/", {
            "product_id": str(self.product.id),
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("suspended", response.data.get("error", "").lower())

    def test_suspended_customer_can_view_orders_and_profile(self):
        self.client.force_authenticate(user=self.suspended_customer)
        
        # 1. Profile / Me view is accessible
        me_resp = self.client.get("/api/v1/auth/me/")
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertFalse(me_resp.data["user"]["is_active"])

        # 2. Orders list is accessible
        orders_resp = self.client.get("/api/v1/orders/")
        self.assertEqual(orders_resp.status_code, status.HTTP_200_OK)


