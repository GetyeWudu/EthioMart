from decimal import Decimal
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.catalog.models import (
    Category,
    Product,
    ProductVariant,
    ProductImage,
    CategoryAttribute,
    Attribute,
)
from apps.catalog.enums import ProductStatus
from apps.catalog.services.taxonomy_service import TaxonomyService
from apps.catalog.services.product_service import ProductService
from apps.catalog.services.product_approval_service import ProductApprovalService
from apps.vendors.models import VendorProfile
from apps.vendors.enums import TrustTier, VendorType
from apps.users.models import CustomUser
from apps.audit_logs.models import AuditLog


class ProductApprovalEngineTests(TestCase):
    def setUp(self):
        self.seller_user = CustomUser.objects.create_user(
            email="merchant@gechexpress.com",
            password="TestPassword123!",
            role=CustomUser.Role.SELLER,
        )
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin@gechexpress.com",
            password="AdminPassword123!",
        )
        self.vendor = VendorProfile.objects.create(
            user=self.seller_user,
            store_name="Abyssinia Electronics",
            slug="abyssinia-electronics",
            tier=TrustTier.PROBATION,
            city="Addis Ababa",
        )
        self.root_cat = TaxonomyService.create_root_category(name="Computing")
        self.leaf_cat = TaxonomyService.create_child_category(parent=self.root_cat, name="Laptops")

    def _create_sample_image(self, product):
        img_file = SimpleUploadedFile("laptop.jpg", b"fake_image_content", content_type="image/jpeg")
        return ProductImage.objects.create(
            product=product,
            image=img_file,
            is_primary=True,
        )

    def test_layer_1_fails_without_images(self):
        product = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="Dell XPS 15",
            price=Decimal("95000.00"),
            description="High performance laptop.",
        )
        # Without images, evaluation must fail Layer 1 and return DRAFT with errors
        status, reason = ProductApprovalService.evaluate_and_process(product)
        self.assertEqual(status, ProductStatus.DRAFT)
        self.assertTrue(any("at least one product image" in r for r in reason))

    def test_layer_2_fails_on_prohibited_keyword(self):
        product = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="Counterfeit Rolex Luxury Replica",
            price=Decimal("15000.00"),
            description="Exact replica first copy.",
        )
        self._create_sample_image(product)

        status, reason = ProductApprovalService.evaluate_and_process(product)
        self.assertEqual(status, ProductStatus.REJECTED)
        self.assertIn("restricted keyword: 'counterfeit'", reason)

    def test_layer_3_probation_vendor_queued_for_review(self):
        self.vendor.tier = TrustTier.PROBATION
        self.vendor.save()

        product = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="MacBook Air M3",
            price=Decimal("140000.00"),
            description="Apple Silicon laptop.",
        )
        self._create_sample_image(product)

        status, reason = ProductApprovalService.evaluate_and_process(product)
        self.assertEqual(status, ProductStatus.PENDING_REVIEW)
        self.assertEqual(reason, "Queued for Admin Review.")

    def test_layer_3_vip_vendor_instantly_auto_approved(self):
        self.vendor.tier = TrustTier.VIP
        self.vendor.save()

        product = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="HP Spectre x360",
            price=Decimal("125000.00"),
            description="Convertible laptop.",
        )
        self._create_sample_image(product)

        status, reason = ProductApprovalService.evaluate_and_process(product)
        self.assertEqual(status, ProductStatus.ACTIVE)
        self.assertIn("VIP / 1P Platform", reason)

    def test_layer_4_admin_approval_and_rejection_with_audit_log(self):
        product = ProductService.create_simple_product(
            vendor=self.vendor,
            category=self.leaf_cat,
            title="Lenovo ThinkPad X1 Carbon",
            price=Decimal("110000.00"),
            description="Business laptop.",
        )
        self._create_sample_image(product)

        # 1. Admin approve
        approved = ProductApprovalService.admin_approve(product, self.admin_user)
        self.assertEqual(approved.status, ProductStatus.ACTIVE)
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.ActionType.PRODUCT_APPROVED, target_id=str(product.id)).exists())

        # 2. Admin reject
        rejected = ProductApprovalService.admin_reject(product, self.admin_user, reason="Copyright infringement reported by brand.")
        self.assertEqual(rejected.status, ProductStatus.REJECTED)
        self.assertEqual(rejected.rejection_reason, "Copyright infringement reported by brand.")
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.ActionType.PRODUCT_REJECTED, target_id=str(product.id)).exists())
