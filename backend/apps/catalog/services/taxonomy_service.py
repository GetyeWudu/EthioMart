import json
import logging
from typing import List, Dict, Any, Optional
from django.core.cache import cache
from django.utils.text import slugify
from apps.catalog.models import Category
from apps.catalog.services.commission_service import CommissionService

logger = logging.getLogger(__name__)

CACHE_KEY_CATEGORY_TREE = "catalog:categories:nested_tree"
CACHE_TTL_CATEGORY_TREE = 60 * 60 * 24  # 24 hours


class TaxonomyService:
    """
    Service managing category tree hierarchy, materialized path operations,
    and high-performance Redis caching.
    """

    @classmethod
    def get_nested_tree(cls, use_cache: bool = True) -> List[Dict[str, Any]]:
        """
        Retrieves the complete active category taxonomy as a nested JSON tree.
        Cached in Redis for sub-millisecond retrieval.
        """
        if use_cache:
            cached_data = cache.get(CACHE_KEY_CATEGORY_TREE)
            if cached_data is not None:
                try:
                    return json.loads(cached_data) if isinstance(cached_data, str) else cached_data
                except Exception as e:
                    logger.warning(f"Error parsing cached category tree: {e}")

        # Build tree using treebeard MP_Node methods
        roots = Category.objects.filter(is_active=True, depth=1)
        tree_data = [cls._dump_node(root) for root in roots]

        # Save to Redis
        try:
            cache.set(CACHE_KEY_CATEGORY_TREE, tree_data, timeout=CACHE_TTL_CATEGORY_TREE)
        except Exception as e:
            logger.warning(f"Failed to cache category tree in Redis: {e}")

        return tree_data

    @classmethod
    def _dump_node(cls, node: Category) -> Dict[str, Any]:
        """Recursively formats a Category node and its active children."""
        children = [cls._dump_node(child) for child in node.get_children().filter(is_active=True)]
        return {
            "id": str(node.id),
            "name": node.name,
            "name_am": node.name_am,
            "slug": node.slug,
            "icon": node.icon,
            "image": node.image.url if node.image else None,
            "commission_rate_override": str(node.commission_rate_override) if node.commission_rate_override else None,
            "effective_commission_rate": str(CommissionService.get_effective_category_commission(node)),
            "is_leaf": node.is_leaf_node(),
            "depth": node.depth,
            "display_order": node.display_order,
            "children": children,
        }

    @classmethod
    def get_breadcrumbs(cls, category: Category) -> List[Dict[str, Any]]:
        """Returns the ancestor path for category breadcrumbs (e.g. Home > Electronics > Laptops)."""
        ancestors = category.get_ancestors()
        trail = list(ancestors) + [category]
        return [
            {
                "id": str(c.id),
                "name": c.name,
                "name_am": c.name_am,
                "slug": c.slug,
            }
            for c in trail
        ]

    @classmethod
    def invalidate_cache(cls) -> None:
        """Purges category tree from Redis."""
        cache.delete(CACHE_KEY_CATEGORY_TREE)
        logger.info("Category tree Redis cache invalidated.")

    @classmethod
    def create_root_category(
        cls,
        name: str,
        name_am: str = "",
        slug: Optional[str] = None,
        icon: str = "",
        commission_rate_override: Optional[float] = None,
        display_order: int = 0
    ) -> Category:
        """Creates a top-level root category node."""
        cat_slug = slug or slugify(name)
        node = Category.add_root(
            name=name,
            name_am=name_am,
            slug=cat_slug,
            icon=icon,
            commission_rate_override=commission_rate_override,
            display_order=display_order,
            is_active=True
        )
        cls.invalidate_cache()
        return node

    @classmethod
    def create_child_category(
        cls,
        parent: Category,
        name: str,
        name_am: str = "",
        slug: Optional[str] = None,
        icon: str = "",
        commission_rate_override: Optional[float] = None,
        display_order: int = 0
    ) -> Category:
        """Adds a child category to an existing parent node."""
        cat_slug = slug or slugify(name)
        child = parent.add_child(
            name=name,
            name_am=name_am,
            slug=cat_slug,
            icon=icon,
            commission_rate_override=commission_rate_override,
            display_order=display_order,
            is_active=True
        )
        cls.invalidate_cache()
        return child


class TaxonomyPromotionService:
    """
    Handles merging and promoting vendor-scoped taxonomy entities to the global marketplace catalog.
    """

    @classmethod
    def promote_brand_to_global(cls, brand_id: str):
        from django.db import transaction
        from apps.catalog.models import Brand, Product
        with transaction.atomic():
            target_brand = Brand.objects.get(id=brand_id)
            clean_name = target_brand.name.strip().lower()

            duplicate_brands = Brand.objects.filter(
                name__iexact=clean_name
            ).exclude(id=target_brand.id)

            Product.objects.filter(brand__in=duplicate_brands).update(brand=target_brand)
            duplicate_brands.delete()

            target_brand.vendor = None
            target_brand.is_global = True
            target_brand.save(update_fields=['vendor', 'is_global'])
            return target_brand

    @classmethod
    def promote_attribute_value_to_global(cls, value_id: str):
        from django.db import transaction
        from apps.catalog.models import AttributeValue, ProductAttributeValue, ProductVariant
        with transaction.atomic():
            target_value = AttributeValue.objects.get(id=value_id)
            clean_val = target_value.value.strip().lower()

            duplicate_values = AttributeValue.objects.filter(
                attribute=target_value.attribute,
                value__iexact=clean_val
            ).exclude(id=target_value.id)

            # Update ProductAttributeValue references
            ProductAttributeValue.objects.filter(attribute_value__in=duplicate_values).update(attribute_value=target_value)
            
            # Update ProductVariant M2M references
            for dup in duplicate_values:
                for variant in dup.product_variants.all():
                    variant.attribute_values.remove(dup)
                    variant.attribute_values.add(target_value)

            duplicate_values.delete()

            target_value.vendor = None
            target_value.is_global = True
            target_value.save(update_fields=['vendor', 'is_global'])
            return target_value

    @classmethod
    def create_category_and_remap_product(cls, product_id: str, parent_category_id: str, new_category_name: str):
        from django.db import transaction
        from apps.catalog.models import Category, Product
        with transaction.atomic():
            product = Product.objects.get(id=product_id)
            parent = Category.objects.get(id=parent_category_id)
            
            # Create the global child category
            new_cat = TaxonomyService.create_child_category(
                parent=parent,
                name=new_category_name,
            )
            
            # Remap product
            product.category = new_cat
            product.suggested_category = ""
            product.save(update_fields=['category', 'suggested_category'])
            return new_cat

