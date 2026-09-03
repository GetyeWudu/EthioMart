"""
apps/vendors/services/vendor_service.py
=======================================
Domain service: VendorProfile CRUD, public store lookup, and platform seed.
"""

import logging
from django.utils.text import slugify
from django.core.cache import cache
from django.db.models import QuerySet
from rest_framework.exceptions import NotFound

from apps.vendors.models import VendorProfile
from apps.vendors.enums import VendorStatus, VendorType, TrustTier

logger = logging.getLogger(__name__)

PUBLIC_STORE_CACHE_TTL = 60 * 5   # 5 minutes


class VendorService:
    @staticmethod
    def get_or_create_profile(user) -> VendorProfile:
        """
        Retrieves or initializes a DRAFT vendor profile for a seller user.
        If the user is a staff member (e.g. MANAGER), returns their employer's profile.
        """
        # First check if this user is an active staff member for any vendor
        if hasattr(user, 'vendor_staff_roles'):
            staff_role = user.vendor_staff_roles.filter(is_active=True).first()
            if staff_role:
                return staff_role.vendor

        existing_profile = VendorProfile.objects.filter(user=user).first()
        if existing_profile:
            return existing_profile

        base_store_name = f"{user.first_name} {user.last_name}'s Store".strip() or f"Store-{str(user.id)[:8]}"
        store_name = base_store_name
        counter = 1
        while VendorProfile.objects.filter(store_name=store_name).exists():
            store_name = f"{base_store_name} ({counter})"
            counter += 1

        profile = VendorProfile.objects.create(
            user=user,
            store_name=store_name,
            vendor_type=VendorType.THIRD_PARTY,
        )
        logger.info(f"VendorProfile created for user {user.email} (DRAFT)")
        return profile

    @staticmethod
    def update_profile(vendor: VendorProfile, data: dict) -> VendorProfile:
        """
        Updates merchant storefront profile fields (branding, contact, location).
        Does NOT allow changing status, commission_rate, tier, or trust metrics.
        """
        protected_fields = {
            "status", "commission_rate", "tier", "dispute_rate",
            "cancellation_rate", "total_completed_orders",
            "is_verified", "verified_at", "verified_by",
            "rejection_reason", "suspension_reason",
        }
        update_fields = []
        for field, value in data.items():
            if field not in protected_fields:
                setattr(vendor, field, value)
                update_fields.append(field)

        if update_fields:
            vendor.full_clean()
            vendor.save(update_fields=update_fields + ["updated_at"])
            # Invalidate public store cache
            cache.delete(f"vendor:public:{vendor.slug}")
            logger.info(f"VendorProfile updated: {vendor.store_name} [{', '.join(update_fields)}]")

        return vendor

    @staticmethod
    def list_approved_stores(search: str = "", page_size: int = 20) -> QuerySet:
        """
        Returns paginated queryset of active APPROVED stores for the public storefront.
        """
        qs = (
            VendorProfile.objects.filter(status=VendorStatus.APPROVED)
            .select_related("user")
            .order_by("-created_at")
        )
        if search:
            qs = qs.filter(store_name__icontains=search)
        return qs

    @staticmethod
    def get_public_store(slug: str) -> VendorProfile:
        """
        Retrieves an APPROVED public-facing store by slug.
        Returns 404 if not found or not APPROVED.
        Redis-cached for 5 minutes.
        """
        cache_key = f"vendor:public:{slug}"
        vendor_id = cache.get(cache_key)

        if vendor_id:
            try:
                return VendorProfile.objects.select_related("user").get(
                    id=vendor_id,
                    status=VendorStatus.APPROVED,
                    deleted_at__isnull=True,
                )
            except VendorProfile.DoesNotExist:
                cache.delete(cache_key)

        try:
            vendor = VendorProfile.objects.select_related("user").get(
                slug=slug,
                status=VendorStatus.APPROVED,
            )
            cache.set(cache_key, str(vendor.id), timeout=PUBLIC_STORE_CACHE_TTL)
            return vendor
        except VendorProfile.DoesNotExist:
            raise NotFound(f"Store '{slug}' not found.")

    @staticmethod
    def seed_platform_store() -> VendorProfile:
        """
        Idempotent seeder: creates/updates the official GechExpress Direct first-party store.
        Called from management command `seed_platform_store`.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        platform_user = User.objects.filter(is_superuser=True).first()
        if not platform_user:
            raise RuntimeError("A Super Admin user is required to seed the platform store.")

        vendor, created = VendorProfile.objects.update_or_create(
            vendor_type=VendorType.PLATFORM,
            defaults={
                "user": platform_user,
                "store_name": "GechExpress Direct",
                "slug": "gechexpress-direct",
                "store_description": "Official GechExpress first-party store.",
                "status": VendorStatus.APPROVED,
                "is_verified": True,
                "commission_rate": 0.00,
                "tier": TrustTier.VIP,
            },
        )
        action = "created" if created else "updated"
        logger.info(f"Platform store '{vendor.store_name}' {action}.")
        return vendor
