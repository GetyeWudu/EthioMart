"""
apps/catalog/services/commission_service.py
===========================================
Domain service for calculating and resolving effective marketplace commission rates.

Resolution hierarchy:
  1. Platform Direct Store (PLATFORM vendor) → 0.00%
  2. Category Specific Override (Leaf Category)
  3. Category Ancestor Tree (Closest Ancestor → Level 1 Root Category)
  4. Vendor Custom Commission Rate (if explicitly overridden)
  5. Global Platform Baseline (PlatformSetting: base_commission_rate, default 10.00%)
"""

import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from apps.core_settings.services import SettingsService
from apps.vendors.enums import VendorType

logger = logging.getLogger(__name__)

DEFAULT_BASE_COMMISSION = Decimal("10.00")


class CommissionService:

    @classmethod
    def get_global_base_rate(cls) -> Decimal:
        """Fetches the global baseline platform commission rate from platform settings."""
        rate = SettingsService.get("base_commission_rate", DEFAULT_BASE_COMMISSION)
        try:
            return Decimal(str(rate))
        except (ValueError, TypeError):
            return DEFAULT_BASE_COMMISSION

    @classmethod
    def get_effective_category_commission(cls, category) -> Decimal:
        """
        Resolves the effective commission percentage for a category node.
        Traverses upward through the tree:
          - Leaf Category override (if set)
          - Closest ancestor override up to Level 1 root category
          - Global base rate fallback if no overrides exist
        """
        if category is None:
            return cls.get_global_base_rate()

        # 1. Check direct override on the category
        if category.commission_rate_override is not None:
            return Decimal(str(category.commission_rate_override))

        # 2. Traverse ancestors from closest parent up to root
        try:
            ancestors = list(category.get_ancestors())
            for ancestor in reversed(ancestors):
                if ancestor.commission_rate_override is not None:
                    return Decimal(str(ancestor.commission_rate_override))
        except Exception as e:
            logger.warning(f"Failed to traverse ancestors for category {getattr(category, 'id', None)}: {e}")

        # 3. Fallback to global base rate
        return cls.get_global_base_rate()

    @classmethod
    def get_effective_commission_rate(
        cls,
        product=None,
        vendor=None,
        category=None,
    ) -> Decimal:
        """
        Calculates the definitive effective commission rate (%) for a product, vendor, or category.
        """
        # Resolve vendor
        resolved_vendor = vendor
        if resolved_vendor is None and product is not None:
            resolved_vendor = getattr(product, "vendor", None)

        # 1. Platform Direct Stores always pay 0%
        if resolved_vendor is not None and resolved_vendor.vendor_type == VendorType.PLATFORM:
            return Decimal("0.00")

        # Resolve category
        resolved_category = category
        if resolved_category is None and product is not None:
            resolved_category = getattr(product, "category", None)

        # 2. Category tree resolution
        cat_rate = cls.get_effective_category_commission(resolved_category)
        global_rate = cls.get_global_base_rate()

        # If a category override was found in the tree, it takes precedence
        if resolved_category is not None and cat_rate != global_rate:
            return cat_rate

        # 3. Check vendor custom rate if vendor explicitly differs from default
        if resolved_vendor is not None and hasattr(resolved_vendor, "commission_rate"):
            vendor_rate = Decimal(str(resolved_vendor.commission_rate))
            if vendor_rate != DEFAULT_BASE_COMMISSION:
                return vendor_rate

        return cat_rate

    @classmethod
    def calculate_commission(
        cls,
        gross_amount: Decimal,
        product=None,
        vendor=None,
        category=None,
    ) -> tuple[Decimal, Decimal]:
        """
        Calculates the commission rate and monetary deduction for a given gross amount.

        Returns:
            (effective_rate_percent, commission_amount_etb)
        """
        rate = cls.get_effective_commission_rate(
            product=product,
            vendor=vendor,
            category=category,
        )
        rate_fraction = rate / Decimal("100")
        commission_amount = (Decimal(str(gross_amount)) * rate_fraction).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )
        return rate, commission_amount
