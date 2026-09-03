"""
apps/users/tests/test_auth.py
=============================
Integration tests for customer registration, seller registration, login with JWT custom claims, and cookies.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken
from apps.users.models import CustomUser


class AuthEndpointsTests(APITestCase):
    def setUp(self):
        self.customer_data = {
            "first_name": "Abebe",
            "last_name": "Kebede",
            "email": "abebe.test@gechexpress.com",
            "phone_number": "+251911223344",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
        }

    def test_customer_registration_success(self):
        url = reverse("auth:register-customer")
        response = self.client.post(url, self.customer_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "abebe.test@gechexpress.com")
        self.assertEqual(response.data["user"]["role"], "CUSTOMER")

        # Verify JWT access token claims
        token = AccessToken(response.data["access"])
        self.assertEqual(token["role"], "CUSTOMER")
        self.assertFalse(token["is_staff"])
        self.assertFalse(token["is_superuser"])

        # Verify cookie headers
        self.assertIn("gechexpress_access", response.cookies)
        self.assertIn("gechexpress_refresh", response.cookies)

    def test_seller_registration_requires_phone(self):
        url = reverse("auth:register-seller")
        invalid_data = {
            "first_name": "Store",
            "last_name": "Owner",
            "email": "seller.test@store.com",
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
            # missing phone_number
        }
        response = self.client.post(url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seller_registration_success(self):
        url = reverse("auth:register-seller")
        seller_data = {
            "first_name": "Sara",
            "last_name": "Hailu",
            "email": "seller.success@techhaven.com",
            "phone_number": "0911223344",  # local format should normalize
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
        }
        response = self.client.post(url, seller_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "SELLER")
        self.assertEqual(response.data["user"]["phone_number"], "+251911223344")

    def test_login_success_and_jwt_claims(self):
        user = CustomUser.objects.create_user(
            email="login.test@gechexpress.com",
            password="StrongPassword123!",
            first_name="John",
            last_name="Doe",
            role=CustomUser.Role.ADMIN,
            is_staff=True,
            is_superuser=False,
        )

        url = reverse("auth:login")
        response = self.client.post(
            url,
            {"email": "login.test@gechexpress.com", "password": "StrongPassword123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        
        # Verify JWT claims for Operational Admin
        token = AccessToken(response.data["access"])
        self.assertEqual(token["role"], "ADMIN")
        self.assertTrue(token["is_staff"])
        self.assertFalse(token["is_superuser"])
        self.assertEqual(token["first_name"], "John")

    def test_login_invalid_credentials(self):
        url = reverse("auth:login")
        response = self.client.post(
            url,
            {"email": "nonexistent@gechexpress.com", "password": "WrongPassword!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["success"])
