from django.core.management.base import BaseCommand
from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile
from apps.catalog.models import Category, Brand, Attribute, AttributeValue, Product, ProductVariant, ProductImage
from apps.inventory.models import WarehouseLocation, WarehouseStock, StockMovement
from decimal import Decimal

class Command(BaseCommand):
    help = "Seed demo products with multi-variants and partitioned warehouse stock"

    def handle(self, *args, **kwargs):
        # 1. Get or create seller user & vendor
        seller_user, _ = CustomUser.objects.get_or_create(
            email="seller@gechexpress.com",
            defaults={"full_name": "Abyssinia Direct", "phone_number": "+251911223344", "role": "SELLER"}
        )
        seller_user.set_password("Seller@1234")
        seller_user.save()

        vendor, _ = VendorProfile.objects.get_or_create(
            user=seller_user,
            defaults={
                "store_name": "Abyssinia Tech Direct",
                "slug": "abyssinia-tech-direct",
                "phone_number": "+251911223344",
                "business_type": "INDIVIDUAL",
                "kyc_status": "APPROVED",
                "is_payout_ready": True,
                "tier": "TRUSTED",
            }
        )

        # 2. Get facilities
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

        # 3. Category & Brand
        cat = Category.objects.filter(slug__icontains="smartphone").first() or Category.objects.filter(is_leaf=True).first()
        if not cat:
            cat = Category.add_root(name="Smartphones & Tablets", slug="smartphones-tablets", is_leaf=True)

        brand, _ = Brand.objects.get_or_create(name="Samsung", defaults={"slug": "samsung", "is_verified": True})

        # 4. Attributes
        color_attr, _ = Attribute.objects.get_or_create(name="Color", defaults={"attribute_type": "SELECT"})
        val_black, _ = AttributeValue.objects.get_or_create(attribute=color_attr, value="Titanium Black", defaults={"color_code": "#1F2022"})
        val_gray, _ = AttributeValue.objects.get_or_create(attribute=color_attr, value="Titanium Gray", defaults={"color_code": "#8A8D91"})

        storage_attr, _ = Attribute.objects.get_or_create(name="Storage Capacity", defaults={"attribute_type": "SELECT", "unit": "GB"})
        val_256, _ = AttributeValue.objects.get_or_create(attribute=storage_attr, value="256GB")
        val_512, _ = AttributeValue.objects.get_or_create(attribute=storage_attr, value="512GB")

        # 5. Create Demo Product
        prod, _ = Product.objects.get_or_create(
            slug="samsung-galaxy-s24-ultra-5g",
            defaults={
                "vendor": vendor,
                "category": cat,
                "brand": brand,
                "title": "Samsung Galaxy S24 Ultra 5G (AI Edition)",
                "short_description": "200MP Camera, Snapdragon 8 Gen 3, Built-in S-Pen, Titanium Frame.",
                "description": "Experience next-level mobile intelligence with Galaxy AI, titanium durability, and a 6.8-inch Dynamic AMOLED 2X flat display with Corning Gorilla Armor.",
                "product_type": "CONFIGURABLE_VARIANT",
                "status": "ACTIVE",
            }
        )

        ProductImage.objects.get_or_create(
            product=prod,
            display_order=0,
            defaults={
                "image": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop",
                "is_primary": True
            }
        )

        # 6. Variants & Warehouse Stocks
        # Variant 1: Black 256GB (In Stock: 8 total)
        v1, _ = ProductVariant.objects.get_or_create(
            product=prod,
            sku="SAM-S24U-BLK-256",
            defaults={
                "price": Decimal("185000.00"),
                "compare_at_price": Decimal("198000.00"),
                "is_default": True,
                "is_active": True
            }
        )
        v1.attribute_values.set([val_black, val_256])
        ws1, _ = WarehouseStock.objects.get_or_create(warehouse=wh_bole, variant=v1, defaults={"quantity_on_hand": 5, "quantity_reserved": 0})
        ws2, _ = WarehouseStock.objects.get_or_create(warehouse=wh_merkato, variant=v1, defaults={"quantity_on_hand": 3, "quantity_reserved": 0})

        # Variant 2: Black 512GB (Low Stock: 2 total -> triggers scarcity badge)
        v2, _ = ProductVariant.objects.get_or_create(
            product=prod,
            sku="SAM-S24U-BLK-512",
            defaults={
                "price": Decimal("205000.00"),
                "compare_at_price": Decimal("220000.00"),
                "is_default": False,
                "is_active": True
            }
        )
        v2.attribute_values.set([val_black, val_512])
        WarehouseStock.objects.get_or_create(warehouse=wh_bole, variant=v2, defaults={"quantity_on_hand": 2, "quantity_reserved": 0, "low_stock_threshold": 5})

        # Variant 3: Gray 512GB (Out of Stock: 0 total -> triggers Gray-Out / Strike-Through Rule)
        v3, _ = ProductVariant.objects.get_or_create(
            product=prod,
            sku="SAM-S24U-GRY-512",
            defaults={
                "price": Decimal("205000.00"),
                "compare_at_price": Decimal("220000.00"),
                "is_default": False,
                "is_active": True
            }
        )
        v3.attribute_values.set([val_gray, val_512])
        WarehouseStock.objects.get_or_create(warehouse=wh_bole, variant=v3, defaults={"quantity_on_hand": 0, "quantity_reserved": 0})

        self.stdout.write(self.style.SUCCESS("Demo product 'Samsung Galaxy S24 Ultra 5G' seeded with 3 variant dimensions and multi-warehouse inventory."))
