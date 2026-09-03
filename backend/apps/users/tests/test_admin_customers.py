from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import CustomUser, CustomerAddress
from apps.orders.models import Order, OrderPaymentStatus


class AdminCustomerManagementTests(APITestCase):
    def setUp(self):
        # 1. Admin
        self.admin_user = CustomUser.objects.create_superuser(
            email="admin.customer.test@gechexpress.com",
            password="AdminPassword123!",
            first_name="Super",
            last_name="Admin",
            role=CustomUser.Role.ADMIN
        )

        # 2. Customers
        self.customer1 = CustomUser.objects.create_user(
            email="cust1@gechexpress.com",
            password="Password123!",
            first_name="Abebe",
            last_name="Bikila",
            phone_number="+251911223344",
            role=CustomUser.Role.CUSTOMER,
            is_active=True,
            is_email_verified=True,
        )
        self.customer2 = CustomUser.objects.create_user(
            email="cust2@gechexpress.com",
            password="Password123!",
            first_name="Derartu",
            last_name="Tulu",
            phone_number="+251922334455",
            role=CustomUser.Role.CUSTOMER,
            is_active=False,
            is_email_verified=False,
        )

        # 3. Customer Address
        self.address = CustomerAddress.objects.create(
            user=self.customer1,
            full_name="Abebe Bikila",
            phone_number="+251911223344",
            city="Addis Ababa",
            subcity="Bole",
            woreda="03",
            house_no="124",
            is_default=True
        )

        # 4. Paid Order
        self.order = Order.objects.create(
            order_number="ORD-CUST-1001",
            customer=self.customer1,
            total_amount=Decimal("3500.00"),
            payment_status=OrderPaymentStatus.PAID
        )

    def test_admin_can_list_customers_with_metrics(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/admin/customers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["count"], 2)

        cust1_data = next(c for c in response.data["customers"] if c["id"] == str(self.customer1.id))
        self.assertEqual(cust1_data["total_orders"], 1)
        self.assertEqual(Decimal(str(cust1_data["total_spent"])), Decimal("3500.00"))

    def test_admin_can_filter_and_search_customers(self):
        self.client.force_authenticate(user=self.admin_user)
        
        # Search by name
        resp = self.client.get("/api/v1/admin/customers/?search=Derartu")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["customers"][0]["id"], str(self.customer2.id))

        # Filter by status
        resp_active = self.client.get("/api/v1/admin/customers/?status=ACTIVE")
        self.assertEqual(resp_active.data["count"], 1)
        self.assertEqual(resp_active.data["customers"][0]["id"], str(self.customer1.id))

    def test_admin_can_get_customer_stats(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/admin/customers/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = response.data["stats"]
        self.assertEqual(stats["total_customers"], 2)
        self.assertEqual(stats["active_customers"], 1)
        self.assertEqual(stats["inactive_customers"], 1)

    def test_admin_can_get_customer_detail(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f"/api/v1/admin/customers/{self.customer1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["customer"]["email"], "cust1@gechexpress.com")
        self.assertEqual(len(response.data["customer"]["addresses"]), 1)
        self.assertEqual(len(response.data["customer"]["orders"]), 1)

    def test_admin_can_toggle_customer_status(self):
        self.client.force_authenticate(user=self.admin_user)
        # Suspend customer 1
        response = self.client.post(f"/api/v1/admin/customers/{self.customer1.id}/toggle-status/", {"is_active": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_active"])
        self.customer1.refresh_from_db()
        self.assertFalse(self.customer1.is_active)

    def test_admin_can_verify_email(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f"/api/v1/admin/customers/{self.customer2.id}/verify-email/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_email_verified"])
        self.customer2.refresh_from_db()
        self.assertTrue(self.customer2.is_email_verified)
