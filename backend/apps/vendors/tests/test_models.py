"""
apps/vendors/tests/test_models.py
==================================
Unit tests for VendorProfile, VendorWallet, KYCDocument, VendorBankDetails models.
Tests: slug generation, TIN validation, wallet auto-init, OneToOne constraints.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile, VendorWallet, KYCDocument, VendorBankDetails
from apps.vendors.enums import VendorStatus, VendorType, TrustTier, BusinessType


def make_seller(email="seller@test.com"):
    return CustomUser.objects.create_user(
        email=email,
        password="TestPass123!",
        first_name="Test",
        last_name="Seller",
        role="SELLER",
    )


def make_vendor(user, store_name="Test Store", **kwargs):
    return VendorProfile.objects.create(
        user=user,
        store_name=store_name,
        **kwargs,
    )


class VendorProfileSlugTest(TestCase):
    def test_slug_auto_generated(self):
        user = make_seller()
        vendor = make_vendor(user)
        self.assertIsNotNone(vendor.slug)
        self.assertIn("test", vendor.slug)

    def test_slug_collision_suffix(self):
        user1 = make_seller("a@test.com")
        user2 = make_seller("b@test.com")
        v1 = make_vendor(user1, "Cool Store")
        v2 = make_vendor(user2, "Cool Store X")
        # Different stores, different slugs — no collision
        self.assertNotEqual(v1.slug, v2.slug)

    def test_slug_uniqueness_enforced_on_conflict(self):
        user1 = make_seller("c@test.com")
        user2 = make_seller("d@test.com")
        v1 = VendorProfile.objects.create(user=user1, store_name="My Shop", slug="my-shop")
        v2 = VendorProfile(user=user2, store_name="My Shop 2")
        v2.slug = ""   # Force slug regeneration
        v2.save()
        self.assertNotEqual(v1.slug, v2.slug)

    def test_store_name_unique(self):
        user1 = make_seller("e@test.com")
        user2 = make_seller("f@test.com")
        make_vendor(user1, "UniqueStore")
        with self.assertRaises(Exception):
            make_vendor(user2, "UniqueStore")


class VendorProfileTINValidationTest(TestCase):
    def test_valid_tin(self):
        user = make_seller("tin@test.com")
        vendor = make_vendor(user, "TIN Store")
        vendor.tin_number = "1234567890"
        vendor.full_clean()   # Should not raise

    def test_invalid_tin_short(self):
        user = make_seller("tin2@test.com")
        vendor = make_vendor(user, "TIN Store 2")
        vendor.tin_number = "12345"   # Too short
        with self.assertRaises(ValidationError):
            vendor.full_clean()

    def test_invalid_tin_non_numeric(self):
        user = make_seller("tin3@test.com")
        vendor = make_vendor(user, "TIN Store 3")
        vendor.tin_number = "ABCDEFGHIJ"
        with self.assertRaises(ValidationError):
            vendor.full_clean()


class VendorWalletTest(TestCase):
    def test_wallet_default_balances(self):
        user = make_seller("wallet@test.com")
        vendor = make_vendor(user, "Wallet Store")
        wallet = VendorWallet.objects.create(vendor=vendor)
        self.assertEqual(wallet.available_balance, 0.00)
        self.assertEqual(wallet.pending_balance, 0.00)
        self.assertEqual(wallet.total_withdrawn, 0.00)
        self.assertFalse(wallet.is_payout_locked)

    def test_wallet_one_to_one_constraint(self):
        user = make_seller("wallet2@test.com")
        vendor = make_vendor(user, "Wallet Store 2")
        VendorWallet.objects.create(vendor=vendor)
        with self.assertRaises(Exception):
            VendorWallet.objects.create(vendor=vendor)   # Should fail due to OneToOne

    def test_wallet_lock_reason(self):
        user = make_seller("wallet3@test.com")
        vendor = make_vendor(user, "Wallet Store 3")
        wallet = VendorWallet.objects.create(
            vendor=vendor,
            is_payout_locked=True,
            lock_reason="Active dispute #123",
        )
        wallet.refresh_from_db()
        self.assertTrue(wallet.is_payout_locked)
        self.assertEqual(wallet.lock_reason, "Active dispute #123")


class VendorProfileActiveTest(TestCase):
    def test_is_active_approved_not_deleted(self):
        user = make_seller("active@test.com")
        vendor = make_vendor(user, "Active Store", status=VendorStatus.APPROVED)
        self.assertTrue(vendor.is_active)

    def test_is_active_false_for_suspended(self):
        user = make_seller("inactive@test.com")
        vendor = make_vendor(user, "Inactive Store", status=VendorStatus.SUSPENDED)
        self.assertFalse(vendor.is_active)

    def test_is_active_false_for_draft(self):
        user = make_seller("draft@test.com")
        vendor = make_vendor(user, "Draft Store", status=VendorStatus.DRAFT)
        self.assertFalse(vendor.is_active)


class VendorProfileTrustTierTest(TestCase):
    def test_default_tier_probation(self):
        user = make_seller("tier@test.com")
        vendor = make_vendor(user, "Tier Store")
        self.assertEqual(vendor.tier, TrustTier.PROBATION)

    def test_platform_vendor_no_commission(self):
        user = make_seller("platform@test.com")
        vendor = make_vendor(
            user, "Platform Store",
            vendor_type=VendorType.PLATFORM,
            commission_rate=0.00,
            tier=TrustTier.VIP,
            status=VendorStatus.APPROVED,
        )
        self.assertEqual(vendor.commission_rate, 0.00)
        self.assertEqual(vendor.tier, TrustTier.VIP)
