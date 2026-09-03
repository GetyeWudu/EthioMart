"""
apps/core_settings/services.py
==============================
Domain service for reading and updating platform settings with Redis caching.
"""

import json
import logging
from decimal import Decimal
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from .models import PlatformSetting

logger = logging.getLogger(__name__)

CACHE_PREFIX = "platform_setting:"
CACHE_TTL = 3600  # 1 hour


class SettingsService:
    @staticmethod
    def _cast_value(raw_val: str, val_type: str):
        if raw_val is None:
            return None
        try:
            if val_type == PlatformSetting.ValueType.DECIMAL:
                return Decimal(str(raw_val))
            elif val_type == PlatformSetting.ValueType.INTEGER:
                return int(raw_val)
            elif val_type == PlatformSetting.ValueType.BOOLEAN:
                return str(raw_val).lower() in ("true", "1", "t", "yes", "y")
            elif val_type == PlatformSetting.ValueType.JSON:
                return json.loads(raw_val)
            return str(raw_val)
        except Exception as e:
            logger.error(f"Failed to cast setting value '{raw_val}' as {val_type}: {e}")
            return raw_val

    @classmethod
    def get(cls, key: str, default=None):
        """
        Fetch typed setting value with Redis cache lookup.
        """
        cache_key = f"{CACHE_PREFIX}{key}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            setting = PlatformSetting.objects.get(key=key)
            typed_val = cls._cast_value(setting.value, setting.value_type)
            cache.set(cache_key, typed_val, timeout=CACHE_TTL)
            return typed_val
        except PlatformSetting.DoesNotExist:
            return default

    @classmethod
    @transaction.atomic
    def set(cls, key: str, value, actor=None, description: str = "", is_public: bool = False, value_type: str = None) -> PlatformSetting:
        """
        Update or create a setting, invalidate cache, and log audit.
        """
        if value_type is None:
            if isinstance(value, bool):
                value_type = PlatformSetting.ValueType.BOOLEAN
            elif isinstance(value, (int,)):
                value_type = PlatformSetting.ValueType.INTEGER
            elif isinstance(value, (Decimal, float)):
                value_type = PlatformSetting.ValueType.DECIMAL
            elif isinstance(value, (dict, list)):
                value_type = PlatformSetting.ValueType.JSON
            else:
                value_type = PlatformSetting.ValueType.STRING

        str_val = json.dumps(value) if value_type == PlatformSetting.ValueType.JSON else str(value)

        setting, created = PlatformSetting.objects.select_for_update().get_or_create(
            key=key,
            defaults={
                "value": str_val,
                "value_type": value_type,
                "description": description,
                "is_public": is_public,
                "updated_by": actor,
            }
        )

        if not created:
            setting.value = str_val
            setting.value_type = value_type
            if description:
                setting.description = description
            setting.is_public = is_public
            setting.updated_by = actor
            setting.save()

        # Invalidate and populate cache
        cache_key = f"{CACHE_PREFIX}{key}"
        typed_val = cls._cast_value(str_val, value_type)
        cache.set(cache_key, typed_val, timeout=CACHE_TTL)

        return setting

    @classmethod
    def get_all_public(cls) -> dict:
        """
        Return dict of all public settings with their typed values.
        """
        cache_key = "platform_settings:all_public"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        public_settings = PlatformSetting.objects.filter(is_public=True)
        res = {}
        for s in public_settings:
            res[s.key] = cls._cast_value(s.value, s.value_type)

        cache.set(cache_key, res, timeout=300)
        return res

    @classmethod
    def seed_defaults(cls):
        """
        Initializes platform default settings if not already in DB.
        """
        defaults = [
            ("default_currency", "ETB", PlatformSetting.ValueType.STRING, "Marketplace functional settlement currency (immutable).", True),
            ("base_commission_rate", "10.00", PlatformSetting.ValueType.DECIMAL, "Platform baseline commission percentage.", False),
            ("vat_rate", "15.00", PlatformSetting.ValueType.DECIMAL, "Ethiopian brokerage VAT rate (15%).", False),
            ("escrow_hold_hours", "48", PlatformSetting.ValueType.INTEGER, "Holding duration for funds in escrow post-delivery (48h inspection window).", False),
            ("free_shipping_minimum_etb", "2500.00", PlatformSetting.ValueType.DECIMAL, "Minimum order value qualifying for free shipping.", True),
            ("min_payout_threshold_etb", "1000.00", PlatformSetting.ValueType.DECIMAL, "Minimum vendor balance to request manual payout.", False),
            ("low_stock_threshold", "5", PlatformSetting.ValueType.INTEGER, "Threshold triggering seller low stock notifications.", True),
            ("max_product_images", "10", PlatformSetting.ValueType.INTEGER, "Maximum images allowed per product upload.", True),
            ("maintenance_mode", "false", PlatformSetting.ValueType.BOOLEAN, "Global store maintenance mode flag.", True),
            ("platform_name", "GechExpress Platform", PlatformSetting.ValueType.STRING, "Platform public brand name.", True),
            ("support_email", "admin@gechexpress.com", PlatformSetting.ValueType.STRING, "Customer support contact address.", True),
            ("chapa_environment", "test", PlatformSetting.ValueType.STRING, "Active Chapa gateway mode (test vs live).", True),
            ("enforce_seller_2fa", "true", PlatformSetting.ValueType.BOOLEAN, "Require 2FA for verified merchant staff.", True),
            ("strict_passwords", "true", PlatformSetting.ValueType.BOOLEAN, "Enforce strict password complexity policy.", True),
        ]

        created_count = 0
        for key, val, vtype, desc, is_pub in defaults:
            obj, created = PlatformSetting.objects.get_or_create(
                key=key,
                defaults={
                    "value": val,
                    "value_type": vtype,
                    "description": desc,
                    "is_public": is_pub,
                }
            )
            if not created and obj.is_public != is_pub:
                obj.is_public = is_pub
                obj.save(update_fields=["is_public"])
            cache_key = f"{CACHE_PREFIX}{key}"
            cache.set(cache_key, cls._cast_value(obj.value, obj.value_type), timeout=CACHE_TTL)
            if created:
                created_count += 1

        cache.delete("platform_settings:all_public")
        logger.info(f"Seeded {created_count} platform default settings.")
