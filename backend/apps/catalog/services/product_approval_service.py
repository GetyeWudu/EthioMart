import random
import logging
from typing import Tuple, List, Optional
from decimal import Decimal
from django.utils import timezone
from django.core.cache import cache
from apps.catalog.models import Product, ProductVariant, CategoryAttribute
from apps.catalog.enums import ProductStatus
from apps.vendors.enums import TrustTier, VendorType
from apps.audit_logs.models import AuditLog
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification
from django.contrib.auth import get_user_model

User = get_user_model()

logger = logging.getLogger(__name__)

DEFAULT_KEYWORD_BLACKLIST = [
    "counterfeit",
    "replica",
    "fake",
    "first copy",
    "stolen",
    "firearm",
    "ammunition",
    "narcotics",
    "illicit",
    "unauthorized copy",
]

CACHE_KEY_BLACKLIST = "catalog:moderation:blacklist_keywords"
MAX_TRUSTED_AUTO_APPROVE_PRICE = Decimal("50000.00")  # 50,000 ETB cap for auto-approval


class ProductApprovalService:
    """
    4-Layer automated policy evaluation engine for merchant product listings.
    """

    @classmethod
    def evaluate_and_process(cls, product: Product) -> Tuple[ProductStatus, str]:
        """
        Executes the 4-layer auto-approval pipeline when a merchant submits a product.
        Returns (new_status, status_reason).
        """
        # -------------------------------------------------------------
        # LAYER 1: Structural Integrity & Policy Validation
        # -------------------------------------------------------------
        l1_errors = cls._evaluate_layer_1_structural(product)
        if l1_errors:
            # Leave the product in DRAFT status, do not reject.
            # Returning DRAFT status signals to the view to return HTTP 400 with errors.
            return product.status, l1_errors

        # -------------------------------------------------------------
        # LAYER 2: Prohibited Keyword & Counterfeit Blacklist Check
        # -------------------------------------------------------------
        l2_clean, l2_detected = cls._evaluate_layer_2_blacklist(product)
        if not l2_clean:
            product.status = ProductStatus.REJECTED
            product.rejection_reason = f"[Prohibited Content] Listing contains restricted keyword: '{l2_detected}'."
            product.save(update_fields=["status", "rejection_reason", "updated_at"])
            return product.status, product.rejection_reason

        # -------------------------------------------------------------
        # LAYER 3: Vendor Trust-Tier Evaluation
        # -------------------------------------------------------------
        vendor = product.vendor
        tier = getattr(vendor, "tier", TrustTier.PROBATION)
        vendor_type = getattr(vendor, "vendor_type", VendorType.THIRD_PARTY)

        # 1P Platform Store and VIP Vendors: Instant 100% Auto-Approval
        if vendor_type == VendorType.PLATFORM or tier == TrustTier.VIP:
            product.status = ProductStatus.ACTIVE
            product.rejection_reason = ""
            product.save(update_fields=["status", "rejection_reason", "updated_at"])
            logger.info(f"Product {product.id} instantly auto-approved for VIP/Platform vendor {vendor.store_name}.")
            return product.status, "Auto-approved via VIP / 1P Platform trust tier."

        # TRUSTED Vendors: Auto-approve under 50,000 ETB with 5% random audit spot-check
        if tier == TrustTier.TRUSTED:
            highest_price = max((v.price for v in product.variants.all()), default=Decimal("0.00"))
            if highest_price <= MAX_TRUSTED_AUTO_APPROVE_PRICE:
                # 5% random quality control spot check
                is_spot_check = random.random() < 0.05
                if not is_spot_check:
                    product.status = ProductStatus.ACTIVE
                    product.rejection_reason = ""
                    product.save(update_fields=["status", "rejection_reason", "updated_at"])
                    logger.info(f"Product {product.id} auto-approved for TRUSTED vendor {vendor.store_name}.")
                    return product.status, "Auto-approved via TRUSTED trust tier."
                else:
                    logger.info(f"Product {product.id} selected for 5% spot check audit.")

        # PROBATION Vendors or flagged listings -> Queue for Admin Moderation
        product.status = ProductStatus.PENDING_REVIEW
        product.rejection_reason = ""
        product.save(update_fields=["status", "rejection_reason", "updated_at"])
        logger.info(f"Product {product.id} queued for Admin Review (Vendor tier: {tier}).")
        
        # Notify Admins about new pending product
        admins = User.objects.filter(role="ADMIN", is_active=True)
        for admin in admins:
            NotificationService.send_notification(
                user=admin,
                type=Notification.NotificationType.SYSTEM_ALERT,
                title="New Product Pending Review",
                message=f"A new product '{product.title}' has been submitted by {vendor.store_name} and requires moderation.",
                related_link="/admin/products"
            )

        return product.status, "Queued for Admin Review."

    @classmethod
    def _evaluate_layer_1_structural(cls, product: Product) -> List[str]:
        """Validates category leaf node, image presence, variants, and required attributes. Returns a list of error strings."""
        errors = []

        # 1. Category must be a leaf node
        category = product.category
        if not category.is_leaf_node():
            errors.append(f"Category '{category.name}' is a department/parent node. Products must be attached to a terminal leaf category.")

        # 2. Must have at least 1 image
        if not product.images.exists():
            errors.append("Product must have at least one product image uploaded.")

        # 3. Must have at least 1 active variant with price > 0
        variants = product.variants.filter(is_active=True)
        if not variants.exists():
            errors.append("Product must have at least one active SKU variant with price and stock.")

        for v in variants:
            if v.price <= Decimal("0.00"):
                errors.append(f"Variant SKU '{v.sku}' price must be greater than 0 ETB.")
            if v.compare_at_price and v.compare_at_price <= v.price:
                errors.append(f"Variant SKU '{v.sku}' compare-at price must be greater than the selling price.")

        # 4. Enforce is_required CategoryAttributes
        required_attrs = CategoryAttribute.objects.filter(
            category=category,
            is_required=True
        ).select_related("attribute")

        for ca in required_attrs:
            attr = ca.attribute
            if ca.is_variant_creator:
                # Must be present across all variants
                has_in_variants = all(
                    v.attribute_values.filter(attribute=attr).exists()
                    for v in variants
                )
                if not has_in_variants:
                    errors.append(f"Required variant attribute '{attr.name}' is missing on one or more SKU variants.")
            else:
                # Must be present in product specifications
                has_in_specs = product.specifications.filter(attribute=attr).exists()
                if not has_in_specs:
                    errors.append(f"Required specification attribute '{attr.name}' is missing from product details.")

        return errors

    @classmethod
    def _evaluate_layer_2_blacklist(cls, product: Product) -> Tuple[bool, Optional[str]]:
        """Scans product title, short_description, and description against blacklist keywords."""
        blacklist = cache.get(CACHE_KEY_BLACKLIST)
        if not blacklist:
            blacklist = DEFAULT_KEYWORD_BLACKLIST

        text_corpus = f"{product.title} {product.short_description} {product.description}".lower()

        for term in blacklist:
            if term.lower() in text_corpus:
                return False, term

        return True, None

    # -------------------------------------------------------------
    # LAYER 4: Admin Moderation Actions
    # -------------------------------------------------------------
    @classmethod
    def admin_approve(cls, product: Product, admin_user) -> Product:
        """Approves a listing from the admin moderation queue."""
        product.status = ProductStatus.ACTIVE
        product.rejection_reason = ""
        product.save(update_fields=["status", "rejection_reason", "updated_at"])

        AuditLog.objects.create(
            actor=admin_user,
            actor_email=getattr(admin_user, "email", ""),
            actor_role=getattr(admin_user, "role", "ADMIN"),
            action=AuditLog.ActionType.PRODUCT_APPROVED,
            target_type="Product",
            target_id=str(product.id),
            target_repr=product.title,
            payload={"action": "ADMIN_PRODUCT_APPROVED", "title": product.title, "vendor_id": str(product.vendor_id)}
        )
        logger.info(f"Product {product.id} approved by admin {getattr(admin_user, 'email', '')}.")
        
        # Notify Vendor
        if product.vendor and product.vendor.user:
            NotificationService.send_notification(
                user=product.vendor.user,
                type=Notification.NotificationType.SYSTEM_ALERT,
                title="Product Approved",
                message=f"Your product '{product.title}' has been approved and is now active on the platform.",
                related_link=f"/seller/products/{product.id}"
            )
            
        return product

    @classmethod
    def admin_reject(cls, product: Product, admin_user, reason: str) -> Product:
        """Rejects a listing with a mandatory reason."""
        if not reason or len(reason.strip()) < 5:
            raise ValueError("Rejection reason must be at least 5 characters.")

        product.status = ProductStatus.REJECTED
        product.rejection_reason = reason.strip()
        product.save(update_fields=["status", "rejection_reason", "updated_at"])

        AuditLog.objects.create(
            actor=admin_user,
            actor_email=getattr(admin_user, "email", ""),
            actor_role=getattr(admin_user, "role", "ADMIN"),
            action=AuditLog.ActionType.PRODUCT_REJECTED,
            target_type="Product",
            target_id=str(product.id),
            target_repr=product.title,
            payload={"action": "ADMIN_PRODUCT_REJECTED", "title": product.title, "reason": reason.strip()}
        )
        logger.info(f"Product {product.id} rejected by admin {getattr(admin_user, 'email', '')} with reason: {reason}.")
        
        # Notify Vendor
        if product.vendor and product.vendor.user:
            NotificationService.send_notification(
                user=product.vendor.user,
                type=Notification.NotificationType.SYSTEM_ALERT,
                title="Product Rejected",
                message=f"Your product '{product.title}' was rejected by moderation. Reason: {reason.strip()}",
                related_link=f"/seller/products/{product.id}/edit"
            )

        return product
