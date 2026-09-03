"""
apps/users/tests/test_models.py
===============================
Unit tests for CustomUser model, role properties, and soft-delete behaviors.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.users.models import CustomUser


class CustomUserModelTests(TestCase):
    def test_create_customer_user_success(self):
        user = CustomUser.objects.create_user(
            email="customer@gechexpress.com",
            password="SecurePassword123!",
            first_name="Abebe",
            last_name="Bikila",
            phone_number="+251911223344",
            role=CustomUser.Role.CUSTOMER,
        )
        self.assertEqual(user.email, "customer@gechexpress.com")
        self.assertTrue(user.check_password("SecurePassword123!"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_customer)
        self.assertFalse(user.is_seller)
        self.assertFalse(user.is_super_admin)
        self.assertEqual(user.get_full_name(), "Abebe Bikila")

    def test_create_seller_user(self):
        user = CustomUser.objects.create_user(
            email="seller@techhaven.store",
            password="SecurePassword123!",
            first_name="Sara",
            last_name="Hailu",
            phone_number="+251922334455",
            role=CustomUser.Role.SELLER,
        )
        self.assertEqual(user.role, CustomUser.Role.SELLER)
        self.assertTrue(user.is_seller)
        self.assertFalse(user.is_staff)

    def test_create_superuser(self):
        admin = CustomUser.objects.create_superuser(
            email="superadmin@gechexpress.com",
            password="SuperPassword123!",
            first_name="Super",
            last_name="Admin",
        )
        self.assertEqual(admin.role, CustomUser.Role.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_super_admin)
        self.assertFalse(admin.is_operational_admin)
        self.assertTrue(admin.is_email_verified)

    def test_soft_delete_behavior(self):
        user = CustomUser.objects.create_user(
            email="delete_me@example.com",
            password="Password123!",
            first_name="Temp",
            last_name="User",
        )
        user_id = user.id
        self.assertEqual(CustomUser.objects.filter(id=user_id).count(), 1)

        # Soft delete
        user.delete()
        self.assertEqual(CustomUser.objects.filter(id=user_id).count(), 0)
        self.assertEqual(CustomUser.all_objects.filter(id=user_id).count(), 1)
        self.assertTrue(user.is_deleted)

        # Restore
        user.restore()
        self.assertEqual(CustomUser.objects.filter(id=user_id).count(), 1)
        self.assertFalse(user.is_deleted)
