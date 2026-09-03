from django.test import TestCase
from apps.inventory.models import WarehouseLocation
from apps.inventory.services.warehouse_service import WarehouseService
from apps.vendors.models import VendorProfile, VendorStaff
from apps.users.models import CustomUser


class WarehouseAndStaffTests(TestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            email="store_owner@gechexpress.com",
            password="TestPassword123!",
            role=CustomUser.Role.SELLER,
        )
        self.clerk = CustomUser.objects.create_user(
            email="clerk@gechexpress.com",
            password="TestPassword123!",
            role=CustomUser.Role.SELLER,
        )

    def test_default_warehouse_auto_provisioned_on_vendor_creation(self):
        vendor = VendorProfile.objects.create(
            user=self.owner,
            store_name="Merkato Super Depot",
            slug="merkato-super-depot",
            contact_phone="+251912345678",
            city="Addis Ababa",
            subcity="Kirkos",
            street_address="Merkato Military Tera",
        )

        # Signal should have auto-created a default warehouse
        warehouses = WarehouseLocation.objects.filter(vendor=vendor)
        self.assertEqual(warehouses.count(), 1)

        default_wh = warehouses.first()
        self.assertTrue(default_wh.is_default)
        self.assertEqual(default_wh.city, "Addis Ababa")
        self.assertTrue(default_wh.code.startswith("WH-MERKATO"))

    def test_multi_warehouse_creation_and_default_switching(self):
        vendor = VendorProfile.objects.create(
            user=self.owner,
            store_name="Adama Wholesale Hub",
            slug="adama-wholesale-hub",
            city="Adama",
        )
        default_wh = vendor.warehouses.first()
        self.assertTrue(default_wh.is_default)

        # Add second warehouse as new default
        second_wh = WarehouseService.create_warehouse(
            vendor=vendor,
            name="Hawassa Depot",
            code="WH-HAWASSA-01",
            city="Hawassa",
            street_address="Piazza Main St",
            is_default=True,
        )

        default_wh.refresh_from_db()
        self.assertFalse(default_wh.is_default)
        self.assertTrue(second_wh.is_default)

    def test_staff_role_delegation(self):
        vendor = VendorProfile.objects.create(
            user=self.owner,
            store_name="Bole Electronics",
            slug="bole-electronics",
            city="Addis Ababa",
        )
        wh = vendor.warehouses.first()

        staff = VendorStaff.objects.create(
            vendor=vendor,
            user=self.clerk,
            role=VendorStaff.Role.INVENTORY_CLERK,
            assigned_facility=wh,
        )

        self.assertEqual(staff.role, VendorStaff.Role.INVENTORY_CLERK)
        self.assertEqual(staff.assigned_facility, wh)
