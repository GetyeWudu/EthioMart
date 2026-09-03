import uuid
from django.test import TestCase
from django.core.cache import cache
from apps.catalog.models import Category
from apps.catalog.services.taxonomy_service import TaxonomyService, CACHE_KEY_CATEGORY_TREE


class TaxonomyTreeTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_root_and_child_category_creation(self):
        root = TaxonomyService.create_root_category(name="Electronics", icon="laptop")
        self.assertEqual(root.depth, 1)
        self.assertTrue(root.is_leaf_node())

        child = TaxonomyService.create_child_category(parent=root, name="Laptops")
        self.assertEqual(child.depth, 2)
        self.assertTrue(child.is_leaf_node())

        root.refresh_from_db()
        self.assertFalse(root.is_leaf_node())

    def test_nested_tree_redis_caching_and_invalidation(self):
        root = TaxonomyService.create_root_category(name="Fashion", icon="shirt")
        child = TaxonomyService.create_child_category(parent=root, name="Shoes")

        # Initial fetch populates cache
        tree = TaxonomyService.get_nested_tree(use_cache=True)
        self.assertEqual(len(tree), 1)
        self.assertEqual(tree[0]["name"], "Fashion")
        self.assertEqual(len(tree[0]["children"]), 1)
        self.assertEqual(tree[0]["children"][0]["name"], "Shoes")

        # Verify cached in Redis
        cached_tree = cache.get(CACHE_KEY_CATEGORY_TREE)
        self.assertIsNotNone(cached_tree)

        # Modifying category invalidates cache via signals
        child.name = "Footwear"
        child.save()

        # Cache should be cleared
        self.assertIsNone(cache.get(CACHE_KEY_CATEGORY_TREE))

    def test_breadcrumbs(self):
        root = TaxonomyService.create_root_category(name="Home & Living")
        mid = TaxonomyService.create_child_category(parent=root, name="Kitchen")
        leaf = TaxonomyService.create_child_category(parent=mid, name="Cookware")

        crumbs = TaxonomyService.get_breadcrumbs(leaf)
        self.assertEqual(len(crumbs), 3)
        self.assertEqual(crumbs[0]["name"], "Home & Living")
        self.assertEqual(crumbs[1]["name"], "Kitchen")
        self.assertEqual(crumbs[2]["name"], "Cookware")
