import logging
from decimal import Decimal
from django.db.models import Q
from django.core.management.base import BaseCommand
from django.core.cache import cache
from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile
from apps.catalog.models import (
    Category,
    Brand,
    Attribute,
    AttributeValue,
    CategoryAttribute,
    Product,
    ProductVariant,
    ProductImage,
    ProductAttributeValue,
)
from apps.catalog.services.taxonomy_service import TaxonomyService
from apps.inventory.models import WarehouseLocation, WarehouseStock

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Seeds full demo catalog (categories, attributes, values, bound specs, products, multi-warehouse stock)"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding complete demo catalog...")

        # 1. Ensure Superuser Admin, Seller & Customer Users
        admin_user, _ = CustomUser.objects.get_or_create(
            email="admin@gechexpress.com",
            defaults={
                "first_name": "Gech",
                "last_name": "Admin",
                "phone_number": "+251911000000",
                "role": "ADMIN",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "is_email_verified": True,
            }
        )
        admin_user.set_password("Admin@1234")
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

        seller_user, _ = CustomUser.objects.get_or_create(
            email="seller@gechexpress.com",
            defaults={
                "first_name": "Abyssinia",
                "last_name": "Direct",
                "phone_number": "+251911223344",
                "role": "SELLER",
                "is_active": True,
                "is_email_verified": True,
            }
        )
        seller_user.set_password("Seller@1234")
        seller_user.save()

        customer_user, _ = CustomUser.objects.get_or_create(
            email="customer@gechexpress.com",
            defaults={
                "first_name": "Abebe",
                "last_name": "Bikila",
                "phone_number": "+251911556677",
                "role": "CUSTOMER",
                "is_active": True,
                "is_email_verified": True,
            }
        )
        customer_user.set_password("Customer@1234")
        customer_user.save()

        vendor, _ = VendorProfile.objects.get_or_create(
            user=seller_user,
            defaults={
                "store_name": "Abyssinia Tech Direct",
                "slug": "abyssinia-tech-direct",
                "contact_phone": "+251911223344",
                "business_type": "INDIVIDUAL",
                "status": "APPROVED",
                "is_verified": True,
                "tier": "TRUSTED",
            }
        )

        wh_bole, _ = WarehouseLocation.objects.get_or_create(
            vendor=vendor,
            code="WH-BOLE-01",
            defaults={
                "name": "Bole Express Hub & Pickup Locker",
                "city": "Addis Ababa",
                "subcity": "Bole",
                "street_address": "Cameroon St, Near Edna Mall",
                "is_pickup_point": True,
                "is_default": True
            }
        )
        wh_merkato, _ = WarehouseLocation.objects.get_or_create(
            vendor=vendor,
            code="WH-MERKATO-01",
            defaults={
                "name": "Merkato Central Depot",
                "city": "Addis Ababa",
                "subcity": "Kirkos",
                "street_address": "Autobus Tera Logistics Center",
                "is_pickup_point": False
            }
        )

        # 2. Root & Leaf Categories (Treebeard MP_Node)
        # Root: Electronics
        root_elec = Category.objects.filter(slug="consumer-electronics").first()
        if not root_elec:
            root_elec = Category.add_root(name="Consumer Electronics", name_am="ኤሌክትሮኒክስ", slug="consumer-electronics", icon="laptop")

        sub_mobile = Category.objects.filter(slug="phones-tablets").first()
        if not sub_mobile:
            sub_mobile = root_elec.add_child(name="Phones & Accessories", name_am="ስልኮችና ታብሌቶች", slug="phones-tablets")

        leaf_smartphones = Category.objects.filter(slug="smartphones-tablets").first()
        if not leaf_smartphones:
            leaf_smartphones = sub_mobile.add_child(name="Smartphones & Tablets", name_am="ዘመናዊ ስልኮች", slug="smartphones-tablets")

        sub_computers = Category.objects.filter(slug="computers-laptops").first()
        if not sub_computers:
            sub_computers = root_elec.add_child(name="Computers & Computing", name_am="ኮምፒውተሮች", slug="computers-laptops")

        leaf_laptops = Category.objects.filter(slug="laptops").first()
        if not leaf_laptops:
            leaf_laptops = sub_computers.add_child(name="Laptops & Notebooks", name_am="ላፕቶፖች", slug="laptops")

        # Root: Fashion
        root_fashion = Category.objects.filter(slug="fashion-apparel").first()
        if not root_fashion:
            root_fashion = Category.add_root(name="Fashion & Apparel", name_am="ፋሽንና አልባሳት", slug="fashion-apparel", icon="shirt")

        sub_shoes = Category.objects.filter(slug="footwear-shoes").first()
        if not sub_shoes:
            sub_shoes = root_fashion.add_child(name="Footwear & Shoes", name_am="ጫማዎች", slug="footwear-shoes")

        leaf_shoes = Category.objects.filter(slug="running-shoes").first()
        if not leaf_shoes:
            leaf_shoes = sub_shoes.add_child(name="Athletic & Running Shoes", name_am="የስፖርት ጫማዎች", slug="running-shoes")

        # Root: Home & Kitchen
        root_home = Category.objects.filter(slug="home-kitchen").first()
        if not root_home:
            root_home = Category.add_root(name="Home & Kitchen", name_am="የቤት ዕቃዎች", slug="home-kitchen", icon="home")

        # Bind seller allowed categories
        vendor.allowed_categories.set([root_elec, root_fashion, root_home])

        # 3. Brands (fully idempotent via Brand.all_objects to handle soft-deleted records)
        def upsert_brand(slug_key, name, **kwargs):
            obj = Brand.all_objects.filter(Q(slug=slug_key) | Q(name=name)).first()
            if obj is None:
                obj = Brand.objects.create(slug=slug_key, name=name, **kwargs)
            else:
                obj.deleted_at = None
                obj.slug = slug_key
                obj.name = name
                for k, v in kwargs.items():
                    setattr(obj, k, v)
                obj.save()
            return obj

        brand_samsung = upsert_brand("samsung", "Samsung", is_verified=True)
        brand_apple   = upsert_brand("apple", "Apple", is_verified=True)
        brand_nike    = upsert_brand("nike", "Nike", is_verified=True)
        brand_anbessa = upsert_brand("anbessa-shoes", "Anbessa Shoes", is_verified=True, name_am="አንበሳ ጫማ")

        brand_samsung.categories.set([root_elec, sub_mobile, leaf_smartphones])
        brand_apple.categories.set([root_elec, sub_mobile, leaf_smartphones, sub_computers, leaf_laptops])
        brand_nike.categories.set([root_fashion, sub_shoes, leaf_shoes])
        brand_anbessa.categories.set([root_fashion, sub_shoes, leaf_shoes])

        # 4. Attributes & Values
        # Color
        attr_color, _ = Attribute.objects.get_or_create(name="Color", defaults={"attribute_type": "SELECT"})
        val_blk, _ = AttributeValue.objects.get_or_create(attribute=attr_color, value="Titanium Black", defaults={"value_am": "ጥቁር", "color_code": "#1F2022"})
        val_gry, _ = AttributeValue.objects.get_or_create(attribute=attr_color, value="Titanium Gray", defaults={"value_am": "ግራጫ", "color_code": "#8A8D91"})
        val_blu, _ = AttributeValue.objects.get_or_create(attribute=attr_color, value="Midnight Blue", defaults={"value_am": "ሰማያዊ", "color_code": "#1E3A5F"})
        val_red, _ = AttributeValue.objects.get_or_create(attribute=attr_color, value="Phantom Red", defaults={"value_am": "ቀይ", "color_code": "#DC2626"})

        # Storage
        attr_storage, _ = Attribute.objects.get_or_create(name="Storage Capacity", defaults={"attribute_type": "SELECT", "unit": "GB"})
        val_256, _ = AttributeValue.objects.get_or_create(attribute=attr_storage, value="256GB")
        val_512, _ = AttributeValue.objects.get_or_create(attribute=attr_storage, value="512GB")
        val_1tb, _ = AttributeValue.objects.get_or_create(attribute=attr_storage, value="1TB")

        # Shoe Size
        attr_size, _ = Attribute.objects.get_or_create(name="Shoe Size (EU)", defaults={"attribute_type": "SELECT"})
        val_s40, _ = AttributeValue.objects.get_or_create(attribute=attr_size, value="EU 40")
        val_s41, _ = AttributeValue.objects.get_or_create(attribute=attr_size, value="EU 41")
        val_s42, _ = AttributeValue.objects.get_or_create(attribute=attr_size, value="EU 42")
        val_s43, _ = AttributeValue.objects.get_or_create(attribute=attr_size, value="EU 43")

        # 5. Bind CategoryAttributes
        CategoryAttribute.objects.update_or_create(
            category=leaf_smartphones, attribute=attr_color,
            defaults={"is_variant_creator": True, "is_required": True, "is_filterable": True}
        )
        CategoryAttribute.objects.update_or_create(
            category=leaf_smartphones, attribute=attr_storage,
            defaults={"is_variant_creator": True, "is_required": True, "is_filterable": True}
        )
        CategoryAttribute.objects.update_or_create(
            category=leaf_shoes, attribute=attr_size,
            defaults={"is_variant_creator": True, "is_required": True, "is_filterable": True}
        )

        # 6. Seed Product 1: Samsung Galaxy S24 Ultra 5G
        s24_prod, _ = Product.objects.update_or_create(
            slug="samsung-galaxy-s24-ultra-5g",
            defaults={
                "vendor": vendor,
                "category": leaf_smartphones,
                "brand": brand_samsung,
                "title": "Samsung Galaxy S24 Ultra 5G (AI Edition)",
                "short_description": "200MP Camera, Snapdragon 8 Gen 3, Built-in S-Pen, Titanium Frame.",
                "description": "Experience next-level mobile intelligence with Galaxy AI, titanium durability, and a 6.8-inch Dynamic AMOLED 2X flat display with Corning Gorilla Armor.",
                "product_type": "CONFIGURABLE_VARIANT",
                "status": "ACTIVE",
                "custom_specifications": {
                    "Display": "6.8-inch Dynamic AMOLED 2X, 120Hz",
                    "Processor": "Snapdragon 8 Gen 3 for Galaxy",
                    "Battery": "5000mAh with 45W Wired Charging",
                    "Operating System": "One UI 6.1 (Android 14)",
                    "SIM": "Dual Nano-SIM + eSIM",
                    "5G Bands": "Sub-6 GHz + mmWave",
                    "Stylus": "Built-in S Pen with Air Actions",
                }
            }
        )

        ProductImage.objects.update_or_create(
            product=s24_prod,
            display_order=0,
            defaults={
                "image": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop",
                "is_primary": True
            }
        )

        attr_camera, _ = Attribute.objects.get_or_create(name="Main Camera", defaults={"attribute_type": "TEXT"})
        ProductAttributeValue.objects.update_or_create(
            product=s24_prod,
            attribute=attr_camera,
            defaults={"custom_value": "200MP Wide + 50MP Periscope + 12MP Ultra-Wide"}
        )

        # Variant 1: Black 256GB (Healthy Stock: 8 units)
        v1, _ = ProductVariant.objects.update_or_create(
            product=s24_prod,
            sku="SAM-S24U-BLK-256",
            defaults={
                "price": Decimal("185000.00"),
                "compare_at_price": Decimal("198000.00"),
                "is_default": True,
                "is_active": True
            }
        )
        v1.attribute_values.set([val_blk, val_256])
        WarehouseStock.objects.update_or_create(warehouse=wh_bole, variant=v1, defaults={"quantity_on_hand": 5, "quantity_reserved": 0})
        WarehouseStock.objects.update_or_create(warehouse=wh_merkato, variant=v1, defaults={"quantity_on_hand": 3, "quantity_reserved": 0})

        # Variant 2: Black 512GB (Low Stock: 2 units -> Triggers Scarcity Badge)
        v2, _ = ProductVariant.objects.update_or_create(
            product=s24_prod,
            sku="SAM-S24U-BLK-512",
            defaults={
                "price": Decimal("205000.00"),
                "compare_at_price": Decimal("220000.00"),
                "is_default": False,
                "is_active": True
            }
        )
        v2.attribute_values.set([val_blk, val_512])
        WarehouseStock.objects.update_or_create(warehouse=wh_bole, variant=v2, defaults={"quantity_on_hand": 2, "quantity_reserved": 0, "low_stock_threshold": 5})

        # Variant 3: Gray 512GB (Out of Stock: 0 units -> Triggers Gray-Out & Strike-Through Rule)
        v3, _ = ProductVariant.objects.update_or_create(
            product=s24_prod,
            sku="SAM-S24U-GRY-512",
            defaults={
                "price": Decimal("205000.00"),
                "compare_at_price": Decimal("220000.00"),
                "is_default": False,
                "is_active": True
            }
        )
        v3.attribute_values.set([val_gry, val_512])
        WarehouseStock.objects.update_or_create(warehouse=wh_bole, variant=v3, defaults={"quantity_on_hand": 0, "quantity_reserved": 0})

        # Variant 4: Blue 1TB (Full Stock: 12 units)
        v4, _ = ProductVariant.objects.update_or_create(
            product=s24_prod,
            sku="SAM-S24U-BLU-1TB",
            defaults={
                "price": Decimal("235000.00"),
                "compare_at_price": Decimal("250000.00"),
                "is_default": False,
                "is_active": True
            }
        )
        v4.attribute_values.set([val_blu, val_1tb])
        WarehouseStock.objects.update_or_create(warehouse=wh_bole, variant=v4, defaults={"quantity_on_hand": 7, "quantity_reserved": 0})
        WarehouseStock.objects.update_or_create(warehouse=wh_merkato, variant=v4, defaults={"quantity_on_hand": 5, "quantity_reserved": 0})

        # 7. Invalidate and warm Redis Cache
        TaxonomyService.invalidate_cache()
        cache.delete(f"catalog:product:{s24_prod.slug}")

        self.stdout.write(self.style.SUCCESS("Demo catalog seeded successfully!"))
