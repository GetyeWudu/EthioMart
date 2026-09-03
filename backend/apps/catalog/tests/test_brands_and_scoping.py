"""
Tests for Brand Scoping & Category Hierarchy:
  - Category model treebeard operations
  - CategoryBrandsAPIView scoping logic (scoped to category ancestor subtrees + global brands)
  - LeafCategoriesView filtering (leaf-only)
  - BrandSerializer nested categories shape
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.catalog.models import Category, Brand, Attribute, AttributeValue, CategoryAttribute

User = get_user_model()


class CategoryModelTest(TestCase):
    def test_create_root_and_leaf_category(self):
        root = Category.add_root(name="Consumer Electronics", slug="consumer-electronics")
        self.assertEqual(root.depth, 1)
        self.assertTrue(root.is_leaf_node())

        sub = root.add_child(name="Smartphones", slug="smartphones")
        self.assertEqual(sub.depth, 2)
        root.refresh_from_db()
        self.assertFalse(root.is_leaf_node())
        self.assertTrue(sub.is_leaf_node())


class BrandScopingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.root_elec = Category.add_root(name="Electronics", slug="electronics-test")
        self.leaf_phones = self.root_elec.add_child(name="Phones", slug="phones-test")

        self.root_fashion = Category.add_root(name="Fashion", slug="fashion-test")
        self.leaf_shoes = self.root_fashion.add_child(name="Shoes", slug="shoes-test")

        self.brand_samsung = Brand.objects.create(name="Samsung Test", slug="samsung-test", is_verified=True)
        self.brand_samsung.categories.set([self.root_elec])

        self.brand_nike = Brand.objects.create(name="Nike Test", slug="nike-test", is_verified=True)
        self.brand_nike.categories.set([self.root_fashion])

        self.brand_global = Brand.objects.create(name="Generic Brand", slug="generic-brand", is_verified=True)

    def test_category_brands_scoped_to_electronics(self):
        url = f"/api/v1/catalog/categories/{self.leaf_phones.pk}/brands/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        names = [b["name"] for b in response.json()]
        self.assertIn("Samsung Test", names)
        self.assertIn("Generic Brand", names)
        self.assertNotIn("Nike Test", names)

    def test_category_brands_scoped_to_fashion(self):
        url = f"/api/v1/catalog/categories/{self.leaf_shoes.pk}/brands/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        names = [b["name"] for b in response.json()]
        self.assertIn("Nike Test", names)
        self.assertIn("Generic Brand", names)
        self.assertNotIn("Samsung Test", names)

    def test_leaf_category_view_returns_only_leaves(self):
        url = "/api/v1/catalog/categories/leaf/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        slugs = [c["slug"] for c in response.json()]
        self.assertIn("phones-test", slugs)
        self.assertIn("shoes-test", slugs)
        self.assertNotIn("electronics-test", slugs)
        self.assertNotIn("fashion-test", slugs)

    def test_brand_serializer_categories_field(self):
        url = "/api/v1/catalog/admin/brands/"
        admin = User.objects.create_superuser(email="admin-test@gech.test", password="test1234")
        self.client.force_authenticate(user=admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        samsung = next((b for b in response.json() if b["name"] == "Samsung Test"), None)
        self.assertIsNotNone(samsung)
        self.assertIsInstance(samsung["categories"], list)
        self.assertEqual(samsung["categories"][0]["name"], "Electronics")
