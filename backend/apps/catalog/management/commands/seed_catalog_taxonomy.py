"""
apps/catalog/management/commands/seed_catalog_taxonomy.py
=========================================================
Seeds standard marketplace taxonomy, brands, and category attribute bindings.

Usage:
    python manage.py seed_catalog_taxonomy
"""

from django.core.management.base import BaseCommand
from apps.catalog.models import Category, Brand, Attribute, AttributeValue, CategoryAttribute
from apps.catalog.enums import AttributeType
from apps.catalog.services.taxonomy_service import TaxonomyService


class Command(BaseCommand):
    help = "Seeds standard Ethiopian e-commerce category hierarchy, brands, and attribute matrix."

    def handle(self, *args, **options):
        self.stdout.write("Seeding category taxonomy and attributes...")

        # 1. Attributes
        color_attr, _ = Attribute.objects.get_or_create(
            name="Color",
            defaults={"attribute_type": AttributeType.SELECT}
        )
        size_clothing_attr, _ = Attribute.objects.get_or_create(
            name="Clothing Size",
            defaults={"attribute_type": AttributeType.SELECT}
        )
        storage_attr, _ = Attribute.objects.get_or_create(
            name="Storage Capacity",
            defaults={"attribute_type": AttributeType.SELECT, "unit": "GB"}
        )
        ram_attr, _ = Attribute.objects.get_or_create(
            name="RAM Capacity",
            defaults={"attribute_type": AttributeType.SELECT, "unit": "GB"}
        )

        # Attribute Values
        for color, code in [("Black", "#000000"), ("White", "#FFFFFF"), ("Blue", "#1E3A8A"), ("Gold", "#D97706")]:
            AttributeValue.objects.get_or_create(attribute=color_attr, value=color, defaults={"color_code": code})

        for sz in ["XS", "S", "M", "L", "XL", "XXL"]:
            AttributeValue.objects.get_or_create(attribute=size_clothing_attr, value=sz)

        for cap in ["64GB", "128GB", "256GB", "512GB", "1TB"]:
            AttributeValue.objects.get_or_create(attribute=storage_attr, value=cap)

        for ram in ["4GB", "8GB", "16GB", "32GB", "64GB"]:
            AttributeValue.objects.get_or_create(attribute=ram_attr, value=ram)

        # 2. Brands
        for b_name, b_slug in [
            ("Apple", "apple"),
            ("Samsung", "samsung"),
            ("Dell", "dell"),
            ("HP", "hp"),
            ("Lenovo", "lenovo"),
            ("Nike", "nike"),
            ("Adidas", "adidas"),
            ("Zara", "zara"),
            ("Gech Brand", "gech-brand"),
        ]:
            Brand.objects.get_or_create(name=b_name, defaults={"slug": b_slug, "is_verified": True})

        # 3. Categories (Treebeard MP_Node)
        categories_tree = [
            {
                "name": "Electronics & Gadgets",
                "icon": "laptop",
                "children": [
                    {
                        "name": "Smartphones & Tablets",
                        "children": ["Smartphones", "iPads & Tablets", "Phone Accessories"]
                    },
                    {
                        "name": "Laptops & Computers",
                        "children": ["Ultrabooks", "Gaming Laptops", "PC Monitors", "Computer Components"]
                    },
                    {
                        "name": "Audio & Video",
                        "children": ["Headphones & Earbuds", "Bluetooth Speakers", "Smart TVs"]
                    }
                ]
            },
            {
                "name": "Fashion & Apparel",
                "icon": "shirt",
                "children": [
                    {
                        "name": "Men's Fashion",
                        "children": ["Men's Clothing", "Men's Shoes", "Men's Watches & Accessories"]
                    },
                    {
                        "name": "Women's Fashion",
                        "children": ["Women's Clothing", "Women's Shoes", "Handbags & Bags", "Jewelry"]
                    },
                    {
                        "name": "Traditional Ethiopian Wear",
                        "children": ["Habesha Kemis", "Tilfi Shirts", "Netela & Gabi"]
                    }
                ]
            },
            {
                "name": "Home & Living",
                "icon": "home",
                "children": [
                    {
                        "name": "Kitchen & Dining",
                        "children": ["Cookware", "Coffee & Tea Sets", "Jebena & Traditional Sets"]
                    },
                    {
                        "name": "Furniture & Decor",
                        "children": ["Living Room", "Bedroom", "Home Lighting"]
                    }
                ]
            }
        ]

        for root_data in categories_tree:
            root_cat = Category.objects.filter(name=root_data["name"], depth=1).first()
            if not root_cat:
                root_cat = TaxonomyService.create_root_category(name=root_data["name"], icon=root_data.get("icon", ""))

            for mid_data in root_data.get("children", []):
                mid_cat = root_cat.get_children().filter(name=mid_data["name"]).first()
                if not mid_cat:
                    mid_cat = TaxonomyService.create_child_category(parent=root_cat, name=mid_data["name"])

                for leaf_name in mid_data.get("children", []):
                    leaf_cat = mid_cat.get_children().filter(name=leaf_name).first()
                    if not leaf_cat:
                        leaf_cat = TaxonomyService.create_child_category(parent=mid_cat, name=leaf_name)

                        # Bind attributes to leaf categories
                        if "Smartphones" in leaf_name or "Tablets" in leaf_name:
                            CategoryAttribute.objects.get_or_create(
                                category=leaf_cat, attribute=color_attr,
                                defaults={"is_variant_creator": True, "is_required": True, "is_filterable": True}
                            )
                            CategoryAttribute.objects.get_or_create(
                                category=leaf_cat, attribute=storage_attr,
                                defaults={"is_variant_creator": True, "is_required": True, "is_filterable": True}
                            )
                            CategoryAttribute.objects.get_or_create(
                                category=leaf_cat, attribute=ram_attr,
                                defaults={"is_variant_creator": False, "is_required": True, "is_filterable": True}
                            )
                        elif "Clothing" in leaf_name or "Wear" in leaf_name:
                            CategoryAttribute.objects.get_or_create(
                                category=leaf_cat, attribute=size_clothing_attr,
                                defaults={"is_variant_creator": True, "is_required": True, "is_filterable": True}
                            )
                            CategoryAttribute.objects.get_or_create(
                                category=leaf_cat, attribute=color_attr,
                                defaults={"is_variant_creator": True, "is_required": True, "is_filterable": True}
                            )

        # Clear tree cache
        TaxonomyService.invalidate_cache()
        self.stdout.write(self.style.SUCCESS("[OK] Category taxonomy, brands, and attributes seeded successfully."))
