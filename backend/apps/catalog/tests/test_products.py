from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.catalog.models import (
    Category,
    Brand,
    Product,
    ProductVariant,
    Attribute,
    AttributeValue,
    ProductImage,
)
from apps.catalog.enums import ProductStatus, ProductType
from apps.catalog.services.taxonomy_service import TaxonomyService
from apps.catalog.services.product_service import ProductService
from apps.vendors.models import VendorProfile
from apps.users.models import CustomUser


class ProductModelAndServiceTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="seller_catalog@gechexpress.com",
            password="TestPassword123!",
            role=CustomUser.Role.SELLER,
        )
        self.vendor = VendorProfile.objects.create(
            user=self.user,
            store_name="Tech World Ethiopia",
            slug="tech-world-ethiopia",
            contact_phone="+251911223344",
            city="Addis Ababa",
        )
        self.root_cat = TaxonomyService.create_root_category(name="Electronics")
        self.leaf_cat = TaxonomyService.create_child_category(parent=self.root_cat, name="Smartphones")
        self.brand = Brand.objects.create(name="Apple", slug="apple", is_verified=True)

    def test_single_sku_auto_wrapping(self):
        product = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            brand=self.brand,
            title="iPhone 16 Pro Max 256GB",
            price=Decimal("185000.00"),
            compare_at_price=Decimal("195000.00"),
            stock_quantity=10,
            short_description="Flagship smartphone.",
            description="Detailed specifications for iPhone 16 Pro Max.",
        )

        self.assertEqual(product.product_type, ProductType.SIMPLE)
        self.assertEqual(product.variants.count(), 1)

        default_variant = product.variants.first()
        self.assertTrue(default_variant.is_default)
        self.assertEqual(default_variant.price, Decimal("185000.00"))
        self.assertEqual(default_variant.compare_at_price, Decimal("195000.00"))

        # Verify initial stock was seeded in default warehouse
        stock = default_variant.warehouse_stocks.first()
        self.assertIsNotNone(stock)
        self.assertEqual(stock.quantity_on_hand, 10)
        self.assertEqual(stock.quantity_available, 10)

    def test_leaf_category_enforcement(self):
        # Attempting to attach product to non-leaf root category must fail
        with self.assertRaises(ValueError):
            ProductService.create_simple_product(
                vendor=self.vendor,
                category=self.root_cat,
                title="Generic Phone",
                price=Decimal("5000.00"),
            )

    def test_compare_at_price_validation(self):
        product = Product.objects.create(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="Samsung Galaxy S24",
            slug="samsung-galaxy-s24",
            description="Flagship phone",
        )
        variant = ProductVariant(
            product=product,
            sku="SKU-S24-001",
            price=Decimal("120000.00"),
            compare_at_price=Decimal("110000.00"),  # Invalid: less than selling price
        )
        with self.assertRaises(ValidationError):
            variant.clean()

    def test_recommendations_endpoint(self):
        from rest_framework.test import APIClient
        from apps.vendors.enums import VendorStatus
        self.vendor.status = VendorStatus.APPROVED
        self.vendor.subcity = "Bole"
        self.vendor.save()

        p1 = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="iPhone 16 Pro",
            price=Decimal("150000.00"),
            stock_quantity=5,
        )
        p1.status = ProductStatus.ACTIVE
        p1.save()

        p2 = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="iPhone 16 Standard",
            price=Decimal("120000.00"),
            stock_quantity=5,
        )
        p2.status = ProductStatus.ACTIVE
        p2.save()

        client = APIClient()
        response = client.get(f"/api/v1/catalog/products/{p1.slug}/recommendations/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("similar_items", response.data)
        self.assertIn("store_items", response.data)
        self.assertEqual(len(response.data["similar_items"]), 1)
        self.assertEqual(response.data["similar_items"][0]["slug"], p2.slug)
        self.assertEqual(response.data["similar_items"][0]["vendor_location"], "Bole, Addis Ababa")

