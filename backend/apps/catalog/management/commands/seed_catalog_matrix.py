import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import (
    Category,
    Attribute,
    AttributeValue,
    CategoryAttribute,
    Brand,
    ProductType,
    AttributeType
)

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Seeds expanded 7-vertical taxonomy, attributes, category bindings, and scoped brands."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Starting expanded catalog matrix seeding..."))
        
        try:
            with transaction.atomic():
                self._seed_attributes_and_values()
                self._seed_taxonomy_and_bindings()
                self._seed_brands_and_scope()
                
            self.stdout.write(self.style.SUCCESS("Catalog matrix seeded successfully!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding catalog matrix: {str(e)}"))
            raise e

    def _seed_attributes_and_values(self):
        self.stdout.write("Seeding General Attributes & Option Values...")
        
        attributes_data = [
            {
                "name": "Size",
                "code": "size",
                "type": AttributeType.SELECT,
                "values": ["Small (S)", "Medium (M)", "Large (L)", "Extra Large (XL)", "2XL", "3XL"]
            },
            {
                "name": "Shoe Size (EU)",
                "code": "shoe_size",
                "type": AttributeType.SELECT,
                "values": ["39", "40", "41", "42", "43", "44", "45"]
            },
            {
                "name": "Primary Color",
                "code": "color",
                "type": AttributeType.SELECT,
                "values": ["Midnight Black", "Pure White", "Titanium Gray", "Navy Blue", "Emerald Green", "Crimson Red", "Gold"]
            },
            {
                "name": "Capacity / Volume",
                "code": "capacity",
                "type": AttributeType.SELECT,
                "values": ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "50 ml", "100 ml", "250 ml", "1 Litre"]
            }
        ]

        for attr_data in attributes_data:
            attr, created = Attribute.objects.get_or_create(
                name=attr_data["name"],
                defaults={
                    "attribute_type": attr_data["type"]
                }
            )
            for val in attr_data["values"]:
                AttributeValue.objects.get_or_create(
                    attribute=attr,
                    value=val
                )

    def _seed_taxonomy_and_bindings(self):
        self.stdout.write("Seeding Taxonomy and Attribute Bindings...")

        # 7-Verticals with at least 4-5 leaves per vertical
        taxonomy_data = [
            # 1. Fashion & Apparel
            {"path": ["Fashion & Apparel", "Men's Clothing", "Formal & Business Wear", "Men's Suits & Tuxedos"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Fashion & Apparel", "Men's Clothing", "Casual Wear", "Men's T-Shirts & Polos"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Fashion & Apparel", "Women's Clothing", "Formal Wear", "Women's Dresses & Gowns"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Fashion & Apparel", "Women's Clothing", "Casual Wear", "Women's Tops & Tees"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Fashion & Apparel", "Children's Clothing", "Baby Wear", "Baby Onesies & Rompers"], "attrs": ["Size", "Primary Color"]},
            
            # 2. Consumer Electronics
            {"path": ["Consumer Electronics", "Computing & Laptops", "Portable Computers", "Laptops & Ultrabooks"], "attrs": ["Capacity / Volume", "Primary Color"]},
            {"path": ["Consumer Electronics", "Computing & Laptops", "Desktop Computers", "Gaming Desktops"], "attrs": ["Capacity / Volume", "Primary Color"]},
            {"path": ["Consumer Electronics", "Audio & Headphones", "Over-Ear Headphones", "Noise-Cancelling Headphones"], "attrs": ["Primary Color"]},
            {"path": ["Consumer Electronics", "Audio & Headphones", "Earbuds", "True Wireless Earbuds"], "attrs": ["Primary Color"]},
            {"path": ["Consumer Electronics", "Cameras & Photography", "Digital Cameras", "Mirrorless Cameras"], "attrs": ["Primary Color"]},
            
            # 3. Mobile Phones & Tablets
            {"path": ["Mobile Phones & Tablets", "Cellular Phones", "Smartphones", "Flagship Smartphones"], "attrs": ["Capacity / Volume", "Primary Color"]},
            {"path": ["Mobile Phones & Tablets", "Cellular Phones", "Smartphones", "Mid-Range Smartphones"], "attrs": ["Capacity / Volume", "Primary Color"]},
            {"path": ["Mobile Phones & Tablets", "Tablets & E-Readers", "Tablets", "Pro Tablets"], "attrs": ["Capacity / Volume", "Primary Color"]},
            {"path": ["Mobile Phones & Tablets", "Tablets & E-Readers", "Tablets", "Budget Tablets"], "attrs": ["Capacity / Volume", "Primary Color"]},
            {"path": ["Mobile Phones & Tablets", "Wearable Technology", "Smartwatches", "Fitness Smartwatches"], "attrs": ["Size", "Primary Color"]},
            
            # 4. Footwear & Shoes
            {"path": ["Footwear & Shoes", "Men's Shoes", "Athletic & Casual", "Running & Sports Sneakers"], "attrs": ["Shoe Size (EU)", "Primary Color"]},
            {"path": ["Footwear & Shoes", "Men's Shoes", "Formal Shoes", "Leather Oxfords"], "attrs": ["Shoe Size (EU)", "Primary Color"]},
            {"path": ["Footwear & Shoes", "Women's Shoes", "Heels & Pumps", "Stiletto Heels"], "attrs": ["Shoe Size (EU)", "Primary Color"]},
            {"path": ["Footwear & Shoes", "Women's Shoes", "Casual Shoes", "Women's Flats & Loafers"], "attrs": ["Shoe Size (EU)", "Primary Color"]},
            {"path": ["Footwear & Shoes", "Children's Shoes", "School Shoes", "Kids Uniform Shoes"], "attrs": ["Shoe Size (EU)", "Primary Color"]},
            
            # 5. Beauty & Personal Care
            {"path": ["Beauty & Personal Care", "Fragrances", "Luxury Perfumes", "Eau de Parfum Sprays"], "attrs": ["Capacity / Volume"]},
            {"path": ["Beauty & Personal Care", "Skincare", "Face Care", "Anti-Aging Creams"], "attrs": ["Capacity / Volume"]},
            {"path": ["Beauty & Personal Care", "Skincare", "Body Care", "Moisturizing Lotions"], "attrs": ["Capacity / Volume"]},
            {"path": ["Beauty & Personal Care", "Hair Care", "Shampoos & Conditioners", "Sulfate-Free Shampoos"], "attrs": ["Capacity / Volume"]},
            {"path": ["Beauty & Personal Care", "Makeup", "Face Makeup", "Liquid Foundations"], "attrs": ["Primary Color", "Capacity / Volume"]},
            
            # 6. Home & Kitchen
            {"path": ["Home & Kitchen", "Kitchen & Dining", "Small Appliances", "Coffee & Espresso Machines"], "attrs": ["Primary Color", "Capacity / Volume"]},
            {"path": ["Home & Kitchen", "Kitchen & Dining", "Small Appliances", "Blenders & Juicers"], "attrs": ["Primary Color", "Capacity / Volume"]},
            {"path": ["Home & Kitchen", "Home Decor", "Lighting", "LED Table Lamps"], "attrs": ["Primary Color"]},
            {"path": ["Home & Kitchen", "Home Decor", "Rugs & Carpets", "Persian Style Rugs"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Home & Kitchen", "Furniture", "Living Room", "Fabric Sofas & Couches"], "attrs": ["Size", "Primary Color"]},
            
            # 7. Sports & Outdoors
            {"path": ["Sports & Outdoors", "Fitness & Gym", "Workout Apparel", "Activewear Sets"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Sports & Outdoors", "Fitness & Gym", "Equipment", "Dumbbells & Weights"], "attrs": ["Size"]},
            {"path": ["Sports & Outdoors", "Outdoor Recreation", "Camping & Hiking", "Camping Tents"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Sports & Outdoors", "Cycling", "Bicycles", "Mountain Bikes"], "attrs": ["Size", "Primary Color"]},
            {"path": ["Sports & Outdoors", "Team Sports", "Football", "Footballs & Soccer Balls"], "attrs": ["Size"]}
        ]

        def get_or_create_node(name, parent=None):
            slug = slugify(name)
            node = Category.objects.filter(name=name, depth=parent.depth + 1 if parent else 1).first()
            if not node:
                if parent:
                    node = parent.add_child(name=name, slug=slug, is_active=True)
                else:
                    node = Category.add_root(name=name, slug=slug, is_active=True)
            return node

        for item in taxonomy_data:
            path = item["path"]
            parent_node = None
            for idx, cat_name in enumerate(path):
                parent_node = get_or_create_node(cat_name, parent_node)
            
            # The last node is the leaf
            leaf_node = parent_node
            
            # Bind attributes to leaf category
            for attr_name in item["attrs"]:
                attr = Attribute.objects.get(name=attr_name)
                CategoryAttribute.objects.get_or_create(
                    category=leaf_node,
                    attribute=attr,
                    defaults={
                        "is_required": True,
                        "is_variant_creator": True,
                        "is_filterable": True
                    }
                )

    def _seed_brands_and_scope(self):
        self.stdout.write("Seeding Brands and their category scopes...")

        brand_mapping = {
            "Fashion & Apparel": ["Zara", "Hugo Boss", "Armani"],
            "Consumer Electronics": ["Apple", "Samsung", "Dell", "HP", "Sony"],
            "Mobile Phones & Tablets": ["Apple", "Samsung"],
            "Footwear & Shoes": ["Nike", "Adidas", "Puma", "Anbessa Shoes"],
            "Beauty & Personal Care": ["Dior", "Chanel", "CeraVe", "L'Oréal"],
            "Home & Kitchen": ["Philips", "De'Longhi", "Nespresso"],
            "Sports & Outdoors": ["Under Armour", "Gymshark", "Reebok"]
        }

        # Handle Generic/Unbranded as truly global (no categories bound means global in our system, or bind to all roots)
        generic_brand, _ = Brand.objects.get_or_create(
            name="Generic / Unbranded",
            defaults={"slug": slugify("Generic / Unbranded"), "is_verified": True}
        )
        generic_brand.categories.clear() # Global

        # Create and map scoped brands
        for root_cat_name, brands in brand_mapping.items():
            root_cat = Category.objects.filter(name=root_cat_name, depth=1).first()
            if not root_cat:
                self.stdout.write(self.style.WARNING(f"Could not find root category {root_cat_name} to scope brands."))
                continue

            for brand_name in brands:
                brand, _ = Brand.objects.get_or_create(
                    name=brand_name,
                    defaults={"slug": slugify(brand_name), "is_verified": True}
                )
                brand.categories.add(root_cat)
                
