from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.catalog.models import Product, Category
from apps.vendors.models import VendorProfile
from apps.vendors.enums import VendorStatus
from apps.wishlists.models import WishlistItem

User = get_user_model()

class WishlistAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='test@example.com', password='password123', first_name="Test", last_name="User")
        self.client.force_authenticate(user=self.user)
        
        self.vendor_user = User.objects.create_user(email='vendor@example.com', password='password123', first_name="Vendor", last_name="User")
        self.vendor = VendorProfile.objects.create(user=self.vendor_user, store_name="Wishlist Vendor Store", status=VendorStatus.APPROVED)

        self.category = Category.add_root(name='Electronics', slug='electronics', is_active=True)
        self.product1 = Product.objects.create(vendor=self.vendor, title='Laptop', slug='laptop', category=self.category)
        self.product2 = Product.objects.create(vendor=self.vendor, title='Phone', slug='phone', category=self.category)

    def test_toggle_wishlist(self):
        url = reverse('wishlist-toggle')
        
        # Add to wishlist
        response = self.client.post(url, {'product_id': self.product1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['saved'])
        self.assertEqual(WishlistItem.objects.count(), 1)
        
        # Remove from wishlist (toggle)
        response = self.client.post(url, {'product_id': self.product1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['saved'])
        self.assertEqual(WishlistItem.objects.count(), 0)

    def test_sync_wishlist(self):
        url = reverse('wishlist-sync')
        response = self.client.post(url, {'product_ids': [self.product1.id, self.product2.id]}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.count(), 2)
        
        # Syncing again should ignore conflicts (idempotent)
        response = self.client.post(url, {'product_ids': [self.product1.id]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.count(), 2)
