import logging
import uuid
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from apps.catalog.models import (
    Category,
    Brand,
    Attribute,
    AttributeValue,
    CategoryAttribute,
    Product,
    ProductVariant,
    ProductImage,
)
from apps.catalog.enums import ProductStatus, ProductType, AttributeType
from apps.inventory.models import WarehouseLocation, WarehouseStock
from apps.vendors.models import VendorProfile
from apps.vendors.enums import VendorStatus, TrustTier, BusinessType

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = "Seeds the store with 4 vendors, each having 12-14 realistic products, variants, stocks, and Unsplash CDN images."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Starting expanded 4-vendor store seeding..."))

        try:
            with transaction.atomic():
                self._cleanup_stale_categories()
                self._seed_attributes()
                self._seed_vendors_and_products()
            from apps.catalog.services.taxonomy_service import TaxonomyService
            TaxonomyService.invalidate_cache()
            self.stdout.write(self.style.SUCCESS("All 4 vendors and their product catalogs seeded successfully!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding store: {str(e)}"))
            raise e

    def _cleanup_stale_categories(self):
        """Deactivates legacy duplicate categories so only clean 7-vertical taxonomy remains."""
        for slug in ["home-living", "fashion", "electronics"]:
            cat = Category.objects.filter(slug=slug).first()
            if cat:
                cat.is_active = False
                cat.save()
                for d in cat.get_descendants():
                    d.is_active = False
                    d.save()

    def _seed_attributes(self):
        """Ensures standard marketplace attributes and common values exist."""
        attrs_data = [
            ("Primary Color", AttributeType.SELECT, [
                "Midnight Black", "Pure White", "Titanium Gray", "Navy Blue",
                "Emerald Green", "Crimson Red", "Gold", "Charcoal Gray", "Warm Beige"
            ]),
            ("Capacity / Volume", AttributeType.SELECT, [
                "128 GB", "256 GB", "512 GB", "1 TB", "2 TB", "1 Litre", "9.5 Litres"
            ]),
            ("Size", AttributeType.SELECT, [
                "Small (S)", "Medium (M)", "Large (L)", "Extra Large (XL)", "48", "50", "52", "2x3m", "2.5x3.5m"
            ]),
            ("Shoe Size (EU)", AttributeType.SELECT, [
                "38", "39", "40", "41", "42", "43", "44"
            ]),
        ]
        for name, atype, vals in attrs_data:
            attr, _ = Attribute.objects.get_or_create(name=name, defaults={"attribute_type": atype})
            for val in vals:
                AttributeValue.objects.get_or_create(attribute=attr, value=val)

    def _get_or_create_category(self, name, parent_name=None):
        """Finds or dynamically provisions a category in the Treebeard hierarchy."""
        cat = Category.objects.filter(name=name).first()
        if cat:
            return cat

        slug = slugify(name)
        if parent_name:
            parent = Category.objects.filter(name=parent_name).first()
            if not parent:
                parent = Category.add_root(name=parent_name, slug=slugify(parent_name), is_active=True)
            cat = parent.add_child(name=name, slug=slug, is_active=True)
        else:
            cat = Category.add_root(name=name, slug=slug, is_active=True)
        return cat

    def _get_or_create_brand(self, brand_name):
        if not brand_name or brand_name == "Generic / Unbranded":
            brand, _ = Brand.all_objects.get_or_create(
                name="Generic / Unbranded",
                defaults={"slug": "generic-unbranded", "is_verified": True}
            )
        else:
            brand = Brand.all_objects.filter(name=brand_name).first()
            if not brand:
                brand = Brand.objects.create(name=brand_name, slug=slugify(brand_name), is_verified=True)
        if brand.deleted_at:
            brand.deleted_at = None
            brand.save()
        return brand

    def _seed_vendors_and_products(self):
        sellers_data = [
            {
                "email": "seller@gechexpress.com",
                "first_name": "Abyssinia",
                "last_name": "Direct",
                "store_name": "Abyssinia Tech Direct",
                "store_description": "Premier importer and retailer of flagship mobile smartphones, wearables, drones, and personal audio in Ethiopia.",
                "city": "Addis Ababa",
                "subcity": "Bole",
                "phone": "+251911223344",
                "products": self._get_abyssinia_products(),
            },
            {
                "email": "getyewudu13@gmail.com",
                "first_name": "Tech",
                "last_name": "Store",
                "store_name": "Tech Haven",
                "store_description": "High-performance computing, workstation laptops, professional audio equipment, and gaming rigs.",
                "city": "Addis Ababa",
                "subcity": "Kirkos",
                "phone": "+251911334455",
                "products": self._get_tech_haven_products(),
            },
            {
                "email": "getyewudu14@gmail.com",
                "first_name": "Style",
                "last_name": "Store",
                "store_name": "Style Boutique",
                "store_description": "Exclusive designer fashion, handcrafted Habesha Kemis, authentic Italian footwear, and premium lifestyle accessories.",
                "city": "Addis Ababa",
                "subcity": "Bole",
                "phone": "+251911445566",
                "products": self._get_fashion_products(),
            },
            {
                "email": "getyewudu15@gmail.com",
                "first_name": "Home",
                "last_name": "Store",
                "store_name": "Home Essentials",
                "store_description": "Modern Scandinavian home furniture, authentic Persian rugs, bean-to-cup espresso machines, and smart living appliances.",
                "city": "Addis Ababa",
                "subcity": "Yeka",
                "phone": "+251911556677",
                "products": self._get_home_products(),
            },
        ]

        password = "Gech@123"

        for s_data in sellers_data:
            # 1. User
            user, created = User.objects.get_or_create(
                email=s_data["email"],
                defaults={
                    "first_name": s_data["first_name"],
                    "last_name": s_data["last_name"],
                    "role": "SELLER",
                    "phone_number": s_data["phone"],
                    "is_active": True,
                    "is_email_verified": True,
                }
            )
            if created or not user.has_usable_password():
                user.set_password(password)
                user.role = "SELLER"
                user.is_email_verified = True
                user.is_active = True
                user.save()
            self.stdout.write(f"Verified seller user: {user.email}")

            # 2. VendorProfile
            vendor, _ = VendorProfile.objects.get_or_create(
                user=user,
                defaults={
                    "store_name": s_data["store_name"],
                    "slug": slugify(s_data["store_name"]),
                    "store_description": s_data["store_description"],
                    "city": s_data["city"],
                    "subcity": s_data["subcity"],
                    "contact_email": s_data["email"],
                    "contact_phone": s_data["phone"],
                    "business_type": BusinessType.INDIVIDUAL,
                    "status": VendorStatus.APPROVED,
                    "tier": TrustTier.VIP,
                    "is_verified": True,
                    "commission_rate": Decimal("10.00"),
                }
            )
            # Ensure full approval and VIP tier
            vendor.status = VendorStatus.APPROVED
            vendor.tier = TrustTier.VIP
            vendor.is_verified = True
            vendor.save()

            # Assign all root categories to allowed_categories
            root_cats = Category.objects.filter(depth=1)
            if root_cats.exists():
                vendor.allowed_categories.set(root_cats)

            # 3. Default Warehouse
            wh_code = f"WH-{vendor.slug[:6].upper()}-01"
            warehouse, _ = WarehouseLocation.objects.get_or_create(
                vendor=vendor,
                code=wh_code,
                defaults={
                    "name": f"{vendor.store_name} Fulfillment Hub",
                    "city": s_data["city"],
                    "subcity": s_data["subcity"],
                    "street_address": "Main Commercial Center",
                    "is_pickup_point": True,
                    "is_default": True,
                    "is_active": True,
                }
            )

            # 4. Create / Update Products
            for p_data in s_data["products"]:
                self._upsert_product(vendor, warehouse, p_data)

    def _upsert_product(self, vendor, warehouse, data):
        cat = self._get_or_create_category(data["category"], parent_name=data.get("parent_category"))
        brand = self._get_or_create_brand(data.get("brand"))

        base_slug = slugify(data["title"])
        product = Product.all_objects.filter(slug=base_slug).first()

        product_type = ProductType.CONFIGURABLE_VARIANT if data.get("is_configurable") else ProductType.SIMPLE

        if not product:
            product = Product.objects.create(
                vendor=vendor,
                category=cat,
                brand=brand,
                title=data["title"],
                slug=base_slug,
                short_description=data.get("short_description", "High quality marketplace product."),
                description=data.get("description", "Premium product sourced for GechExpress."),
                product_type=product_type,
                status=ProductStatus.ACTIVE,
                is_featured=data.get("is_featured", False),
                custom_specifications=data.get("custom_specifications", {}),
            )
        else:
            product.vendor = vendor
            product.category = cat
            product.brand = brand
            product.title = data["title"]
            product.short_description = data.get("short_description", product.short_description)
            product.description = data.get("description", product.description)
            product.product_type = product_type
            product.status = ProductStatus.ACTIVE
            product.is_featured = data.get("is_featured", product.is_featured)
            product.custom_specifications = data.get("custom_specifications", product.custom_specifications)
            product.deleted_at = None
            product.save()

        # Image setup
        if data.get("image_url"):
            ProductImage.objects.update_or_create(
                product=product,
                is_primary=True,
                defaults={
                    "image": data["image_url"],
                    "display_order": 0,
                    "alt_text": data["title"],
                }
            )

        # Variants and Warehouse Stocks
        title_hash = abs(hash(data["title"])) % 100000
        if data.get("is_configurable") and data.get("variants_data"):
            for idx, v_data in enumerate(data["variants_data"]):
                sku = v_data.get("sku") or f"{vendor.slug[:4].upper()}-{title_hash:05d}-{idx+1}"
                var_obj = ProductVariant.all_objects.filter(sku=sku).first()
                if not var_obj:
                    var_obj = ProductVariant.objects.create(
                        product=product,
                        sku=sku,
                        price=Decimal(str(v_data["price"])),
                        compare_at_price=Decimal(str(v_data["compare_at_price"])) if v_data.get("compare_at_price") else None,
                        is_default=(idx == 0),
                        is_active=True,
                    )
                else:
                    var_obj.product = product
                    var_obj.deleted_at = None
                    var_obj.price = Decimal(str(v_data["price"]))
                    var_obj.compare_at_price = Decimal(str(v_data["compare_at_price"])) if v_data.get("compare_at_price") else None
                    var_obj.is_default = (idx == 0)
                    var_obj.is_active = True
                    var_obj.save()

                # Attribute Values
                attr_value_objs = []
                for attr_name, val_str in v_data.get("attributes", {}).items():
                    val_obj = AttributeValue.objects.filter(attribute__name=attr_name, value=val_str).first()
                    if not val_obj:
                        attr_obj, _ = Attribute.objects.get_or_create(name=attr_name)
                        val_obj, _ = AttributeValue.objects.get_or_create(attribute=attr_obj, value=val_str)
                    attr_value_objs.append(val_obj)
                if attr_value_objs:
                    var_obj.attribute_values.set(attr_value_objs)

                # Stock
                stock_qty = v_data.get("stock_quantity", 25)
                WarehouseStock.objects.update_or_create(
                    warehouse=warehouse,
                    variant=var_obj,
                    defaults={"quantity_on_hand": stock_qty, "quantity_reserved": 0}
                )
        else:
            # Simple Product Variant
            sku = data.get("sku") or f"{vendor.slug[:4].upper()}-{title_hash:05d}-SMP"
            var_obj = ProductVariant.all_objects.filter(sku=sku).first()
            if not var_obj:
                var_obj = ProductVariant.objects.create(
                    product=product,
                    sku=sku,
                    price=Decimal(str(data.get("price", "999.00"))),
                    compare_at_price=Decimal(str(data["compare_at_price"])) if data.get("compare_at_price") else None,
                    is_default=True,
                    is_active=True,
                )
            else:
                var_obj.product = product
                var_obj.deleted_at = None
                var_obj.price = Decimal(str(data.get("price", "999.00")))
                var_obj.compare_at_price = Decimal(str(data["compare_at_price"])) if data.get("compare_at_price") else None
                var_obj.is_default = True
                var_obj.is_active = True
                var_obj.save()

            stock_qty = data.get("stock", 30)
            WarehouseStock.objects.update_or_create(
                warehouse=warehouse,
                variant=var_obj,
                defaults={"quantity_on_hand": stock_qty, "quantity_reserved": 0}
            )

    # -------------------------------------------------------------------------
    # Catalog Definitions (12 Products per Vendor)
    # -------------------------------------------------------------------------

    def _get_abyssinia_products(self):
        """Vendor 1: Abyssinia Tech Direct (Flagship Smartphones, Gadgets, Personal Tech)"""
        return [
            {
                "title": "Samsung Galaxy S24 Ultra 5G AI Edition",
                "category": "Flagship Smartphones",
                "parent_category": "Mobile Phones & Tablets",
                "brand": "Samsung",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop",
                "short_description": "200MP Camera, Snapdragon 8 Gen 3, S-Pen included, Titanium frame.",
                "description": "Experience next-level mobile intelligence with Galaxy AI, titanium durability, and a 6.8-inch Dynamic AMOLED 2X flat display.",
                "custom_specifications": {"Display": "6.8\" AMOLED 120Hz", "RAM": "12GB", "Battery": "5000mAh", "Network": "5G Global"},
                "variants_data": [
                    {"price": "185000", "compare_at_price": "198000", "stock_quantity": 25, "attributes": {"Capacity / Volume": "256 GB", "Primary Color": "Midnight Black"}},
                    {"price": "198000", "compare_at_price": "210000", "stock_quantity": 18, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Titanium Gray"}},
                    {"price": "225000", "compare_at_price": "240000", "stock_quantity": 8, "attributes": {"Capacity / Volume": "1 TB", "Primary Color": "Navy Blue"}},
                ]
            },
            {
                "title": "Apple iPhone 15 Pro Max Titanium",
                "category": "Flagship Smartphones",
                "parent_category": "Mobile Phones & Tablets",
                "brand": "Apple",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop",
                "short_description": "Aerospace-grade titanium design with A17 Pro chip and Action button.",
                "description": "The biggest camera upgrade yet: 5x optical zoom on the telephoto lens, USB-C 3.0 data speeds, and supercharged mobile gaming.",
                "custom_specifications": {"Chip": "A17 Pro", "Camera": "48MP Main + 5x Telephoto", "Screen": "6.7-inch Super Retina XDR"},
                "variants_data": [
                    {"price": "195000", "compare_at_price": "210000", "stock_quantity": 20, "attributes": {"Capacity / Volume": "256 GB", "Primary Color": "Titanium Gray"}},
                    {"price": "215000", "compare_at_price": "230000", "stock_quantity": 12, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Apple iPad Pro 13-inch (M4 Chip)",
                "category": "Pro Tablets",
                "parent_category": "Mobile Phones & Tablets",
                "brand": "Apple",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop",
                "short_description": "Ultra Retina XDR display with groundbreaking M4 processing performance.",
                "description": "Thin, lightweight design paired with the revolutionary tandem OLED Ultra Retina XDR display and hardware-accelerated ray tracing.",
                "custom_specifications": {"Processor": "Apple M4", "Display": "13-inch Tandem OLED", "Stylus Support": "Apple Pencil Pro"},
                "variants_data": [
                    {"price": "170000", "compare_at_price": "185000", "stock_quantity": 15, "attributes": {"Capacity / Volume": "256 GB", "Primary Color": "Titanium Gray"}},
                    {"price": "195000", "compare_at_price": "210000", "stock_quantity": 10, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Pure White"}},
                ]
            },
            {
                "title": "Samsung Galaxy Tab S9 Ultra AMOLED",
                "category": "Pro Tablets",
                "parent_category": "Mobile Phones & Tablets",
                "brand": "Samsung",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=800&auto=format&fit=crop",
                "short_description": "Massive 14.6-inch Dynamic AMOLED 2X display with IP68 water resistance.",
                "description": "Includes an IP68-rated S Pen for precise note-taking, illustration, and multitasking with Samsung DeX desktop mode.",
                "custom_specifications": {"Screen": "14.6\" Dynamic AMOLED 2X", "RAM": "12GB", "Battery": "11200mAh"},
                "variants_data": [
                    {"price": "145000", "compare_at_price": "158000", "stock_quantity": 14, "attributes": {"Capacity / Volume": "256 GB", "Primary Color": "Midnight Black"}},
                    {"price": "162000", "compare_at_price": "175000", "stock_quantity": 8, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Apple Watch Ultra 2 Titanium GPS + Cellular",
                "category": "Fitness Smartwatches",
                "parent_category": "Mobile Phones & Tablets",
                "brand": "Apple",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop",
                "short_description": "Rugged 49mm titanium case with 3000 nits display and dual-frequency GPS.",
                "description": "The most capable sports and adventure smartwatch built for endurance athletes, outdoor adventurers, and ocean explorers.",
                "custom_specifications": {"Case Size": "49mm", "Material": "Grade 5 Titanium", "Battery Life": "Up to 72 hours"},
                "variants_data": [
                    {"price": "98000", "compare_at_price": "108000", "stock_quantity": 15, "attributes": {"Primary Color": "Titanium Gray"}},
                    {"price": "98000", "compare_at_price": "108000", "stock_quantity": 10, "attributes": {"Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Samsung Galaxy Watch 6 Classic (47mm)",
                "category": "Fitness Smartwatches",
                "parent_category": "Mobile Phones & Tablets",
                "brand": "Samsung",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
                "short_description": "Signature rotating bezel with advanced body composition and sleep metrics.",
                "description": "Premium stainless steel design featuring Sapphire Crystal glass, ECG monitoring, and personalized heart rate zones.",
                "custom_specifications": {"Display": "1.5\" Super AMOLED", "Bezel": "Physical Rotating Bezel", "Connectivity": "Bluetooth + LTE"},
                "variants_data": [
                    {"price": "42000", "compare_at_price": "48000", "stock_quantity": 20, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "42000", "compare_at_price": "48000", "stock_quantity": 15, "attributes": {"Primary Color": "Pure White"}},
                ]
            },
            {
                "title": "Sony WH-1000XM5 Wireless ANC Headphones",
                "category": "Noise-Cancelling Headphones",
                "parent_category": "Consumer Electronics",
                "brand": "Sony",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
                "short_description": "Industry-leading active noise cancellation with 8 microphones and LDAC.",
                "description": "Two processors control 8 microphones for unprecedented noise cancellation and crystal-clear hands-free calling quality.",
                "custom_specifications": {"Battery": "30 Hours with ANC", "Driver": "30mm Precision Driver", "Audio": "Hi-Res Audio Wireless"},
                "variants_data": [
                    {"price": "38000", "compare_at_price": "44000", "stock_quantity": 30, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "38000", "compare_at_price": "44000", "stock_quantity": 20, "attributes": {"Primary Color": "Pure White"}},
                ]
            },
            {
                "title": "Apple AirPods Pro (2nd Gen with MagSafe USB-C)",
                "category": "True Wireless Earbuds",
                "parent_category": "Consumer Electronics",
                "brand": "Apple",
                "is_configurable": False,
                "price": "32000",
                "compare_at_price": "36000",
                "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=800&auto=format&fit=crop",
                "short_description": "H2 chip, active noise cancellation, adaptive audio, and USB-C case.",
                "description": "Next-level active noise cancellation, adaptive transparency mode, personalized spatial audio with dynamic head tracking.",
                "custom_specifications": {"Chip": "Apple H2", "Charging": "USB-C & MagSafe", "Water Resistance": "IP54"},
            },
            {
                "title": "DJI Mini 4 Pro Drone (Fly More Combo)",
                "category": "Mirrorless Cameras",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "135000",
                "compare_at_price": "148000",
                "stock": 12,
                "image_url": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=800&auto=format&fit=crop",
                "short_description": "Under 249g ultra-lightweight drone with omnidirectional obstacle sensing.",
                "description": "4K/60fps HDR true vertical shooting, 20km FHD video transmission, and up to 34 minutes of flight time per battery.",
                "custom_specifications": {"Sensor": "1/1.3-inch CMOS", "Video": "4K/60fps HDR", "Weight": "<249g"},
            },
            {
                "title": "Anker 737 Power Bank (PowerCore 24,000mAh 140W)",
                "category": "True Wireless Earbuds",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "16500",
                "compare_at_price": "19000",
                "stock": 35,
                "image_url": "https://images.unsplash.com/photo-1609592424367-e63dce319985?q=80&w=800&auto=format&fit=crop",
                "short_description": "Ultra-powerful 140W bidirectional fast charging with smart digital display.",
                "description": "Charges a 16-inch MacBook Pro or smartphone rapidly. High 24,000mAh battery keeps all your devices powered on long trips.",
                "custom_specifications": {"Capacity": "24,000 mAh", "Total Output": "140W Max", "Ports": "2x USB-C, 1x USB-A"},
            },
            {
                "title": "GoPro HERO12 Black Action Camera Kit",
                "category": "Mirrorless Cameras",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "54000",
                "compare_at_price": "59000",
                "stock": 18,
                "image_url": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=800&auto=format&fit=crop",
                "short_description": "5.3K60 HDR video, HyperSmooth 6.0 stabilization, and waterproof to 33ft.",
                "description": "Best-in-class image quality with HDR video and 2x longer runtime on Enduro battery. Ready for extreme outdoor adventure.",
                "custom_specifications": {"Video": "5.3K at 60fps, 4K at 120fps", "Photo": "27MP", "Stabilization": "HyperSmooth 6.0"},
            },
            {
                "title": "Sony PlayStation 5 Slim 1TB Console",
                "category": "Gaming Desktops",
                "parent_category": "Consumer Electronics",
                "brand": "Sony",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=800&auto=format&fit=crop",
                "short_description": "Slim design with 1TB SSD storage and DualSense wireless haptic controller.",
                "description": "Lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback, adaptive triggers, and 3D Audio.",
                "custom_specifications": {"Storage": "1TB Custom NVMe SSD", "Resolution": "Up to 4K 120Hz / 8K", "Audio": "Tempest 3D AudioTech"},
                "variants_data": [
                    {"price": "78000", "compare_at_price": "85000", "stock_quantity": 16, "attributes": {"Capacity / Volume": "1 TB", "Primary Color": "Pure White"}},
                    {"price": "85000", "compare_at_price": "92000", "stock_quantity": 12, "attributes": {"Capacity / Volume": "1 TB", "Primary Color": "Midnight Black"}},
                ]
            },
        ]

    def _get_tech_haven_products(self):
        """Vendor 2: Tech Haven (Laptops, Gaming Gear, Studio Audio, Pro Computing)"""
        return [
            {
                "title": "Apple MacBook Pro 16-inch M3 Max (36GB RAM)",
                "category": "Laptops & Ultrabooks",
                "parent_category": "Consumer Electronics",
                "brand": "Apple",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
                "short_description": "Supercharged by Apple M3 Max with Liquid Retina XDR 120Hz display.",
                "description": "Unprecedented pro performance for software engineering, 3D rendering, and 8K video editing with up to 22 hours of battery life.",
                "custom_specifications": {"Processor": "Apple M3 Max (14-core CPU)", "Memory": "36GB Unified", "Storage": "1TB SSD"},
                "variants_data": [
                    {"price": "245000", "compare_at_price": "265000", "stock_quantity": 12, "attributes": {"Capacity / Volume": "1 TB", "Primary Color": "Midnight Black"}},
                    {"price": "245000", "compare_at_price": "265000", "stock_quantity": 8, "attributes": {"Capacity / Volume": "1 TB", "Primary Color": "Titanium Gray"}},
                ]
            },
            {
                "title": "Apple MacBook Air 15-inch M3 Chip",
                "category": "Laptops & Ultrabooks",
                "parent_category": "Consumer Electronics",
                "brand": "Apple",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=800&auto=format&fit=crop",
                "short_description": "Strikingly thin design with expansive 15.3-inch Liquid Retina display.",
                "description": "Blazing fast everyday performance with the Apple M3 chip, fanless silent operation, MagSafe 3 charging, and 1080p FaceTime HD camera.",
                "custom_specifications": {"Processor": "Apple M3 (8-core CPU, 10-core GPU)", "Display": "15.3\" Liquid Retina", "Weight": "1.51 kg"},
                "variants_data": [
                    {"price": "145000", "compare_at_price": "158000", "stock_quantity": 15, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Midnight Black"}},
                    {"price": "145000", "compare_at_price": "158000", "stock_quantity": 10, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Titanium Gray"}},
                ]
            },
            {
                "title": "Dell XPS 15 9530 3.5K OLED Touch Laptop",
                "category": "Laptops & Ultrabooks",
                "parent_category": "Consumer Electronics",
                "brand": "Dell",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=800&auto=format&fit=crop",
                "short_description": "13th Gen Intel Core i7, RTX 4060, InfinityEdge OLED Touch display.",
                "description": "A precision-crafted aluminum chassis with carbon fiber palm rest, studio-grade quad speakers, and 100% DCI-P3 color accuracy.",
                "custom_specifications": {"CPU": "Intel Core i7-13700H", "GPU": "NVIDIA GeForce RTX 4060", "Display": "15.6\" 3.5K OLED Touch"},
                "variants_data": [
                    {"price": "165000", "compare_at_price": "180000", "stock_quantity": 10, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Titanium Gray"}},
                    {"price": "185000", "compare_at_price": "200000", "stock_quantity": 6, "attributes": {"Capacity / Volume": "1 TB", "Primary Color": "Titanium Gray"}},
                ]
            },
            {
                "title": "Lenovo ThinkPad X1 Carbon Gen 12",
                "category": "Laptops & Ultrabooks",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "155000",
                "compare_at_price": "170000",
                "stock": 14,
                "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop",
                "short_description": "Legendary ultralight business laptop with Intel Core Ultra 7 and TrackPoint.",
                "description": "Built from carbon fiber and magnesium alloy with MIL-SPEC durability, an ergonomic ThinkPad keyboard, and enterprise security.",
                "custom_specifications": {"Processor": "Intel Core Ultra 7 155H", "RAM": "32GB LPDDR5X", "Weight": "1.09 kg"},
            },
            {
                "title": "ASUS ROG Zephyrus G16 RTX 4080 Gaming Laptop",
                "category": "Gaming Desktops",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "195000",
                "compare_at_price": "215000",
                "stock": 8,
                "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800&auto=format&fit=crop",
                "short_description": "240Hz ROG Nebula OLED display with Intel Core Ultra 9 & RTX 4080.",
                "description": "Ultra-slim 1.49cm CNC aluminum body, Slash Lighting on the lid, and vapor chamber cooling for sustained AAA gaming frames.",
                "custom_specifications": {"GPU": "NVIDIA RTX 4080 12GB", "Display": "16-inch 2.5K 240Hz OLED", "RAM": "32GB DDR5"},
            },
            {
                "title": "LG UltraGear 34-inch Curved WQHD OLED Gaming Monitor",
                "category": "Gaming Desktops",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "85000",
                "compare_at_price": "95000",
                "stock": 11,
                "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
                "short_description": "0.03ms response time, 240Hz refresh rate, 800R curved OLED immersion.",
                "description": "True 10-bit color, 1,500,000:1 contrast ratio, and AMD FreeSync Premium Pro certification for unmatched esports fluidity.",
                "custom_specifications": {"Resolution": "3440 x 1440 (UWQHD)", "Refresh Rate": "240Hz", "Curve": "800R"},
            },
            {
                "title": "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
                "category": "Laptops & Ultrabooks",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop",
                "short_description": "Full CNC aluminum body, double-gasket design, and hot-swappable switches.",
                "description": "Connects up to 3 devices via Bluetooth 5.1 with VIA/QMK firmware programmability and Mac/Windows layout toggle.",
                "custom_specifications": {"Layout": "75%", "Connectivity": "Bluetooth 5.1 & Type-C", "Plate": "Double-Gasket Mount"},
                "variants_data": [
                    {"price": "19500", "compare_at_price": "22000", "stock_quantity": 25, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "19500", "compare_at_price": "22000", "stock_quantity": 18, "attributes": {"Primary Color": "Pure White"}},
                ]
            },
            {
                "title": "Logitech MX Master 3S Wireless Performance Mouse",
                "category": "Laptops & Ultrabooks",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800&auto=format&fit=crop",
                "short_description": "Quiet clicks, MagSpeed electromagnetic scroll wheel, 8K DPI glass sensor.",
                "description": "Ergonomic thumb cradle with customizable gesture buttons and cross-computer Flow multi-device workflow.",
                "custom_specifications": {"Sensor": "8,000 DPI Darkfield", "Battery": "Up to 70 days", "Buttons": "7 Programmable"},
                "variants_data": [
                    {"price": "12000", "compare_at_price": "14000", "stock_quantity": 30, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "12000", "compare_at_price": "14000", "stock_quantity": 20, "attributes": {"Primary Color": "Titanium Gray"}},
                ]
            },
            {
                "title": "Shure SM7B Cardioid Studio Vocal Microphone",
                "category": "Noise-Cancelling Headphones",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "48000",
                "compare_at_price": "54000",
                "stock": 16,
                "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&auto=format&fit=crop",
                "short_description": "The broadcast standard dynamic vocal microphone for podcasts and streaming.",
                "description": "Flat, wide-range frequency response for exceptionally clean and natural music and speech reproduction with electromagnetic shielding.",
                "custom_specifications": {"Type": "Dynamic", "Polar Pattern": "Cardioid", "Connector": "XLR 3-Pin"},
            },
            {
                "title": "Samsung 990 Pro 2TB PCIe 4.0 NVMe SSD",
                "category": "Laptops & Ultrabooks",
                "parent_category": "Consumer Electronics",
                "brand": "Samsung",
                "is_configurable": False,
                "price": "24000",
                "compare_at_price": "28000",
                "stock": 25,
                "image_url": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800&auto=format&fit=crop",
                "short_description": "Sequential read speeds up to 7,450 MB/s for high-end gaming and 4K editing.",
                "description": "Smart thermal control, nickel-coated controller, and Samsung Magician software optimization for heavy professional workloads.",
                "custom_specifications": {"Interface": "PCIe Gen 4.0 x4", "Read Speed": "7,450 MB/s", "Write Speed": "6,900 MB/s"},
            },
            {
                "title": "Sony Alpha 7 IV Full-Frame Mirrorless Camera",
                "category": "Mirrorless Cameras",
                "parent_category": "Consumer Electronics",
                "brand": "Sony",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
                "short_description": "33MP Exmor R sensor with BIONZ XR engine and 4K/60p video capture.",
                "description": "Next-generation real-time Eye AF for humans, animals, and birds, coupled with S-Cinetone color profile for cinematic results.",
                "custom_specifications": {"Sensor": "33MP Full-Frame CMOS", "Stabilization": "5-Axis In-Body", "Autofocus": "759 Phase-Detect Points"},
                "variants_data": [
                    {"price": "210000", "compare_at_price": "225000", "stock_quantity": 8, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "235000", "compare_at_price": "250000", "stock_quantity": 5, "attributes": {"Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Secretlab Titan Evo Ergonomic Gaming Chair",
                "category": "Gaming Desktops",
                "parent_category": "Consumer Electronics",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=800&auto=format&fit=crop",
                "short_description": "Proprietary SoftWeave Plus fabric with 4-way L-ADAPT lumbar support.",
                "description": "Magnetic memory foam head pillow, 4D full-metal armrests, and a 165-degree recline for all-day comfort during coding and gaming sessions.",
                "custom_specifications": {"Upholstery": "SoftWeave Plus Fabric", "Base": "ADC12 Aluminum", "Max Load": "130 kg"},
                "variants_data": [
                    {"price": "68000", "compare_at_price": "75000", "stock_quantity": 12, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "68000", "compare_at_price": "75000", "stock_quantity": 9, "attributes": {"Primary Color": "Titanium Gray"}},
                ]
            },
        ]

    def _get_fashion_products(self):
        """Vendor 3: Style Boutique (Suits, Traditional Silk Dresses, Sneakers, Luxury Wear)"""
        return [
            {
                "title": "Hugo Boss Italian Wool Tailored Fit Suit",
                "category": "Men's Suits & Tuxedos",
                "parent_category": "Fashion & Apparel",
                "brand": "Hugo Boss",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop",
                "short_description": "Crafted from 100% virgin Italian wool with natural stretch and notch lapels.",
                "description": "Impeccable German tailoring designed for corporate summits, black-tie galas, and special weddings.",
                "custom_specifications": {"Material": "100% Super 120s Virgin Wool", "Lining": "Viscose-Cupro", "Fit": "Tailored Slim"},
                "variants_data": [
                    {"price": "48000", "compare_at_price": "55000", "stock_quantity": 10, "attributes": {"Size": "48", "Primary Color": "Navy Blue"}},
                    {"price": "48000", "compare_at_price": "55000", "stock_quantity": 8, "attributes": {"Size": "50", "Primary Color": "Midnight Black"}},
                    {"price": "48000", "compare_at_price": "55000", "stock_quantity": 6, "attributes": {"Size": "52", "Primary Color": "Charcoal Gray"}},
                ]
            },
            {
                "title": "Traditional Hand-Woven Habesha Kemis (Pure Silk)",
                "category": "Women's Dresses & Gowns",
                "parent_category": "Fashion & Apparel",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop",
                "short_description": "Authentic Ethiopian Shemane hand-woven cotton dress with intricate gold Tilf embroidery.",
                "description": "Custom crafted by master weavers in Addis Ababa, complete with a matching Netela shawl for cultural celebrations and holiday festivities.",
                "custom_specifications": {"Fabric": "100% Hand-spun Shemane Cotton", "Embroidery": "Pure Silk Thread Tilf", "Origin": "Addis Ababa, Ethiopia"},
                "variants_data": [
                    {"price": "28000", "compare_at_price": "34000", "stock_quantity": 14, "attributes": {"Size": "Medium (M)", "Primary Color": "Pure White"}},
                    {"price": "28000", "compare_at_price": "34000", "stock_quantity": 10, "attributes": {"Size": "Large (L)", "Primary Color": "Gold"}},
                ]
            },
            {
                "title": "Zara Pure Silk Evening Gown",
                "category": "Women's Dresses & Gowns",
                "parent_category": "Fashion & Apparel",
                "brand": "Zara",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop",
                "short_description": "Floor-length flowing silk maxi gown with halter neckline and open back.",
                "description": "Sensual drape and luminous finish for gala events, evening banquets, and red carpet occasions.",
                "custom_specifications": {"Material": "100% Mulberry Silk", "Care": "Dry Clean Only"},
                "variants_data": [
                    {"price": "19500", "compare_at_price": "24000", "stock_quantity": 12, "attributes": {"Size": "Small (S)", "Primary Color": "Emerald Green"}},
                    {"price": "19500", "compare_at_price": "24000", "stock_quantity": 15, "attributes": {"Size": "Medium (M)", "Primary Color": "Crimson Red"}},
                ]
            },
            {
                "title": "Nike Air Zoom Pegasus 40 Running Shoes",
                "category": "Running & Sports Sneakers",
                "parent_category": "Footwear & Shoes",
                "brand": "Nike",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
                "short_description": "Dual Zoom Air units and React foam midsole for high-energy road running.",
                "description": "Tuned single-layer engineered mesh upper provides dialed-in comfort and secure midfoot containment for daily distance runs.",
                "custom_specifications": {"Midsole": "Nike React Foam", "Drop": "10mm", "Weight": "285g"},
                "variants_data": [
                    {"price": "9800", "compare_at_price": "11500", "stock_quantity": 25, "attributes": {"Shoe Size (EU)": "42", "Primary Color": "Midnight Black"}},
                    {"price": "9800", "compare_at_price": "11500", "stock_quantity": 20, "attributes": {"Shoe Size (EU)": "43", "Primary Color": "Midnight Black"}},
                    {"price": "9800", "compare_at_price": "11500", "stock_quantity": 15, "attributes": {"Shoe Size (EU)": "44", "Primary Color": "Pure White"}},
                ]
            },
            {
                "title": "Adidas Ultraboost Light Performance Sneakers",
                "category": "Running & Sports Sneakers",
                "parent_category": "Footwear & Shoes",
                "brand": "Adidas",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop",
                "short_description": "Light BOOST cushioning with Continental Rubber outsole traction.",
                "description": "30% lighter BOOST material delivers explosive energy return on city pavement and running tracks.",
                "custom_specifications": {"Outsole": "Continental Natural Rubber", "Upper": "PRIMEKNIT+ Textile"},
                "variants_data": [
                    {"price": "11500", "compare_at_price": "13500", "stock_quantity": 20, "attributes": {"Shoe Size (EU)": "41", "Primary Color": "Pure White"}},
                    {"price": "11500", "compare_at_price": "13500", "stock_quantity": 18, "attributes": {"Shoe Size (EU)": "42", "Primary Color": "Midnight Black"}},
                    {"price": "11500", "compare_at_price": "13500", "stock_quantity": 14, "attributes": {"Shoe Size (EU)": "43", "Primary Color": "Navy Blue"}},
                ]
            },
            {
                "title": "Anbessa Genuine Ethiopian Leather Oxfords",
                "category": "Leather Oxfords",
                "parent_category": "Footwear & Shoes",
                "brand": "Anbessa Shoes",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=800&auto=format&fit=crop",
                "short_description": "Handmade in Addis Ababa from top-grain highland leather with Goodyear welt.",
                "description": "A timeless classic crafted by Ethiopia's premier heritage shoemaker. Unmatched longevity, leather lining, and stacked wooden heel.",
                "custom_specifications": {"Leather": "Highland Cowhide Full Grain", "Construction": "Goodyear Welted", "Origin": "Addis Ababa"},
                "variants_data": [
                    {"price": "4500", "compare_at_price": "5200", "stock_quantity": 30, "attributes": {"Shoe Size (EU)": "41", "Primary Color": "Midnight Black"}},
                    {"price": "4500", "compare_at_price": "5200", "stock_quantity": 35, "attributes": {"Shoe Size (EU)": "42", "Primary Color": "Midnight Black"}},
                    {"price": "4500", "compare_at_price": "5200", "stock_quantity": 20, "attributes": {"Shoe Size (EU)": "43", "Primary Color": "Charcoal Gray"}},
                ]
            },
            {
                "title": "Tissot PRX Powermatic 80 Automatic Chronograph",
                "category": "Men's Suits & Tuxedos",
                "parent_category": "Fashion & Apparel",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop",
                "short_description": "Swiss-made automatic caliber with 80-hour power reserve and waffle dial.",
                "description": "Integrated stainless steel bracelet with scratch-resistant sapphire crystal and Nivachron anti-magnetic balance spring.",
                "custom_specifications": {"Movement": "Swiss Automatic (80h reserve)", "Water Resistance": "100m / 10 bar", "Case": "316L Stainless Steel"},
                "variants_data": [
                    {"price": "72000", "compare_at_price": "80000", "stock_quantity": 8, "attributes": {"Primary Color": "Navy Blue"}},
                    {"price": "72000", "compare_at_price": "80000", "stock_quantity": 6, "attributes": {"Primary Color": "Emerald Green"}},
                ]
            },
            {
                "title": "Gymshark Vital Seamless 2.0 Activewear Set",
                "category": "Activewear Sets",
                "parent_category": "Sports & Outdoors",
                "brand": "Gymshark",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
                "short_description": "High-waisted compression leggings and matching sports bra with sweat-wicking knit.",
                "description": "Designed for maximum flexibility and gym workout endurance with seamless jacquard contours and four-way stretch.",
                "custom_specifications": {"Material": "96% Nylon, 4% Elastane", "Fit": "Compressive Slim"},
                "variants_data": [
                    {"price": "6500", "compare_at_price": "7800", "stock_quantity": 25, "attributes": {"Size": "Small (S)", "Primary Color": "Charcoal Gray"}},
                    {"price": "6500", "compare_at_price": "7800", "stock_quantity": 30, "attributes": {"Size": "Medium (M)", "Primary Color": "Navy Blue"}},
                ]
            },
            {
                "title": "Ralph Lauren Classic Piqué Cotton Polo",
                "category": "Men's T-Shirts & Polos",
                "parent_category": "Fashion & Apparel",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1625910513413-56839352e00b?q=80&w=800&auto=format&fit=crop",
                "short_description": "100% breathable combed cotton mesh with signature embroidered pony emblem.",
                "description": "The quintessential smart-casual shirt featuring a ribbed polo collar, two-button placket, and tennis tail hem.",
                "custom_specifications": {"Material": "100% Combed Cotton", "Fit": "Custom Slim Fit"},
                "variants_data": [
                    {"price": "5800", "compare_at_price": "6800", "stock_quantity": 20, "attributes": {"Size": "Medium (M)", "Primary Color": "Navy Blue"}},
                    {"price": "5800", "compare_at_price": "6800", "stock_quantity": 25, "attributes": {"Size": "Large (L)", "Primary Color": "Pure White"}},
                    {"price": "5800", "compare_at_price": "6800", "stock_quantity": 15, "attributes": {"Size": "Extra Large (XL)", "Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Burberry Heritage Double-Breasted Trench Coat",
                "category": "Men's Suits & Tuxedos",
                "parent_category": "Fashion & Apparel",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=800&auto=format&fit=crop",
                "short_description": "Water-resistant cotton gabardine trench coat with vintage check cotton lining.",
                "description": "Invented by Thomas Burberry in 1879, featuring storm flap, epaulettes, and leather-wrapped D-ring belt buckles.",
                "custom_specifications": {"Material": "100% Cotton Gabardine", "Weather Resistance": "Showerproof", "Buttons": "Buffalo Horn"},
                "variants_data": [
                    {"price": "62000", "compare_at_price": "70000", "stock_quantity": 8, "attributes": {"Size": "50", "Primary Color": "Warm Beige"}},
                    {"price": "62000", "compare_at_price": "70000", "stock_quantity": 6, "attributes": {"Size": "52", "Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Ray-Ban Aviator Classic Polarized Sunglasses",
                "category": "Men's Suits & Tuxedos",
                "parent_category": "Fashion & Apparel",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "14000",
                "compare_at_price": "16500",
                "stock": 25,
                "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800&auto=format&fit=crop",
                "short_description": "Original pilot shape with classic gold metal frame and polarized green G-15 lenses.",
                "description": "100% UV protection, exceptional clarity, and timeless retro aesthetic favored by pilots and film icons worldwide.",
                "custom_specifications": {"Frame": "Polished Gold Metal", "Lens": "Polarized Green Crystal G-15", "Size": "Standard 58mm"},
            },
            {
                "title": "Christian Louboutin Classic Patent Stiletto Pumps",
                "category": "Stiletto Heels",
                "parent_category": "Footwear & Shoes",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop",
                "short_description": "Pointed toe stiletto pumps featuring the world-famous lacquered red sole.",
                "description": "Epitome of high-fashion luxury with glossy patent calfskin, slim 100mm heel, and Italian leather craftsmanship.",
                "custom_specifications": {"Heel Height": "100mm", "Sole": "Signature Red Lacquered Leather", "Origin": "Italy"},
                "variants_data": [
                    {"price": "45000", "compare_at_price": "52000", "stock_quantity": 10, "attributes": {"Shoe Size (EU)": "38", "Primary Color": "Warm Beige"}},
                    {"price": "45000", "compare_at_price": "52000", "stock_quantity": 12, "attributes": {"Shoe Size (EU)": "39", "Primary Color": "Midnight Black"}},
                ]
            },
        ]

    def _get_home_products(self):
        """Vendor 4: Home Essentials (Espresso Machines, Kitchen Appliances, Modern Sofas, Persian Rugs)"""
        return [
            {
                "title": "De'Longhi Magnifica S Fully Automatic Espresso Machine",
                "category": "Coffee & Espresso Machines",
                "parent_category": "Home & Kitchen",
                "brand": "De'Longhi",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=80&w=800&auto=format&fit=crop",
                "short_description": "Bean-to-cup espresso and cappuccino maker with manual milk frother.",
                "description": "Extract the freshest Ethiopian Sidama and Yirgacheffe coffee beans with 15-bar pump pressure, customized aroma intensity, and dual cup dispensing.",
                "custom_specifications": {"Pump Pressure": "15 Bar", "Grinder": "13 Adjustable Settings", "Water Tank": "1.8 Litres"},
                "variants_data": [
                    {"price": "42000", "compare_at_price": "48000", "stock_quantity": 15, "attributes": {"Primary Color": "Titanium Gray"}},
                    {"price": "42000", "compare_at_price": "48000", "stock_quantity": 12, "attributes": {"Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Nespresso Vertuo Next Coffee & Espresso Maker",
                "category": "Coffee & Espresso Machines",
                "parent_category": "Home & Kitchen",
                "brand": "Nespresso",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
                "short_description": "Centrifusion technology reads capsule barcodes to deliver five cup sizes.",
                "description": "Brew anything from a single espresso shot to a full 414ml carafe at the single touch of a button with rich, velvety crema.",
                "custom_specifications": {"Extraction": "Centrifusion 4,000 RPM", "Heat-Up Time": "30 Seconds"},
                "variants_data": [
                    {"price": "18500", "compare_at_price": "22000", "stock_quantity": 25, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "18500", "compare_at_price": "22000", "stock_quantity": 18, "attributes": {"Primary Color": "Crimson Red"}},
                ]
            },
            {
                "title": "Philips Series 5000 ProBlend High-Speed Blender",
                "category": "Blenders & Juicers",
                "parent_category": "Home & Kitchen",
                "brand": "Philips",
                "is_configurable": False,
                "price": "12000",
                "compare_at_price": "14500",
                "stock": 30,
                "image_url": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=800&auto=format&fit=crop",
                "short_description": "1000W motor with ProBlend Crush 6-star blades crushes ice in seconds.",
                "description": "Ribbed glass jar creates optimal flow for velvety smoothies, traditional Ethiopian sauces, and frozen drinks.",
                "custom_specifications": {"Power": "1000 W", "Jar Capacity": "2 Litres", "Blades": "6-Star Stainless Steel"},
            },
            {
                "title": "Modern Scandinavian 3-Seater Fabric Sectional Sofa",
                "category": "Fabric Sofas & Couches",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop",
                "short_description": "High-resilience foam cushions upholstered in stain-resistant linen blend fabric.",
                "description": "Solid eucalyptus wood frame with tapered oak legs and reversible chaise lounge for modern living rooms.",
                "custom_specifications": {"Frame": "Kiln-Dried Hardwood", "Upholstery": "High-Performance Linen Blend", "Dimensions": "240cm x 160cm x 85cm"},
                "variants_data": [
                    {"price": "85000", "compare_at_price": "98000", "stock_quantity": 6, "attributes": {"Size": "Large (L)", "Primary Color": "Charcoal Gray"}},
                    {"price": "85000", "compare_at_price": "98000", "stock_quantity": 5, "attributes": {"Size": "Large (L)", "Primary Color": "Warm Beige"}},
                ]
            },
            {
                "title": "Authentic Hand-Knotted Persian Wool Living Room Rug",
                "category": "Persian Style Rugs",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop",
                "short_description": "High knot density pure wool rug dyed with organic plant extracts.",
                "description": "Intricate floral and medallion patterns that bring royal luxury and warmth into your dining or sitting salon.",
                "custom_specifications": {"Material": "100% Hand-Spun Wool on Cotton Warp", "Knot Count": "350 KPSI", "Thickness": "10mm"},
                "variants_data": [
                    {"price": "38000", "compare_at_price": "45000", "stock_quantity": 8, "attributes": {"Size": "2x3m", "Primary Color": "Crimson Red"}},
                    {"price": "48000", "compare_at_price": "56000", "stock_quantity": 6, "attributes": {"Size": "2.5x3.5m", "Primary Color": "Navy Blue"}},
                ]
            },
            {
                "title": "Ninja DualZone 2-Basket Digital Air Fryer (9.5L)",
                "category": "Blenders & Juicers",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "22500",
                "compare_at_price": "26000",
                "stock": 22,
                "image_url": "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop",
                "short_description": "Cook 2 foods 2 ways and finish together with DualZone Smart Finish technology.",
                "description": "6 cooking programs: Air Fry, Max Crisp, Roast, Bake, Reheat, and Dehydrate with non-stick dishwasher-safe crisper plates.",
                "custom_specifications": {"Total Capacity": "9.5 Litres (2x 4.75L Baskets)", "Power": "2470 W", "Temperature": "Up to 240°C"},
            },
            {
                "title": "Roborock S8 Pro Ultra Robot Vacuum & Sonic Mop",
                "category": "Coffee & Espresso Machines",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "115000",
                "compare_at_price": "128000",
                "stock": 10,
                "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop",
                "short_description": "All-in-one self-washing, self-drying, self-emptying, and self-refilling dock.",
                "description": "6000Pa extreme suction, DuoRoller Riser brushes, and VibraRise 2.0 sonic mopping for effortless smart home cleaning.",
                "custom_specifications": {"Suction": "6,000 Pa", "Navigation": "PreciSense LiDAR + Reactive 3D", "Docking": "RockDock Ultra"},
            },
            {
                "title": "Le Creuset Enameled Cast Iron Dutch Oven (26cm)",
                "category": "Fabric Sofas & Couches",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?q=80&w=800&auto=format&fit=crop",
                "short_description": "French handcrafted enameled cast iron for stewing, braising, and baking.",
                "description": "Superior heat distribution and retention with sand-colored interior enamel that resists chipping and dulling over decades of cooking.",
                "custom_specifications": {"Capacity": "5.3 Litres", "Material": "Enameled Cast Iron", "Oven Safe": "Up to 260°C"},
                "variants_data": [
                    {"price": "28000", "compare_at_price": "32000", "stock_quantity": 15, "attributes": {"Primary Color": "Crimson Red"}},
                    {"price": "28000", "compare_at_price": "32000", "stock_quantity": 12, "attributes": {"Primary Color": "Navy Blue"}},
                ]
            },
            {
                "title": "Minimalist Arc Dimmable LED Floor Lamp",
                "category": "LED Table Lamps",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
                "short_description": "Curved contemporary arch design with step-less foot pedal dimmer.",
                "description": "Heavy marble base prevents tipping while warm 3000K diffused LED light illuminates reading corners and living spaces.",
                "custom_specifications": {"Height": "205cm", "Base": "Solid White Marble", "Color Temp": "2700K - 5000K Adjustable"},
                "variants_data": [
                    {"price": "14500", "compare_at_price": "17000", "stock_quantity": 20, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "16000", "compare_at_price": "19000", "stock_quantity": 15, "attributes": {"Primary Color": "Gold"}},
                ]
            },
            {
                "title": "Wüsthof Classic 7-Piece German Steel Knife Block Set",
                "category": "Fabric Sofas & Couches",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "34000",
                "compare_at_price": "39000",
                "stock": 16,
                "image_url": "https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=800&auto=format&fit=crop",
                "short_description": "Precision forged from a single piece of high-carbon stainless steel in Solingen, Germany.",
                "description": "Includes chef knife, santoku, utility knife, bread knife, honing steel, kitchen shears, and natural beechwood storage block.",
                "custom_specifications": {"Steel": "X50CrMoV15 Stainless Steel", "Hardness": "58 HRC", "Origin": "Solingen, Germany"},
            },
            {
                "title": "Dyson Purifier Hot+Cool Formaldehyde HP09",
                "category": "Coffee & Espresso Machines",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": False,
                "price": "76000",
                "compare_at_price": "85000",
                "stock": 12,
                "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=800&auto=format&fit=crop",
                "short_description": "HEPA H13 filtration captures 99.97% of particles with smart app control.",
                "description": "Purifies, heats, and cools rooms automatically while continuously destroying formaldehyde with Air Multiplier projection technology.",
                "custom_specifications": {"Filtration": "HEPA H13 + Carbon + SCO Catalytic", "Oscillation": "350 Degrees", "Control": "MyDyson App & Remote"},
            },
            {
                "title": "Fellow Ode Gen 2 Conical Burr Electric Coffee Grinder",
                "category": "Coffee & Espresso Machines",
                "parent_category": "Home & Kitchen",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_url": "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop",
                "short_description": "64mm professional grade flat burrs with anti-static technology.",
                "description": "Precision single-dose grinding tailored for Pour-Over, French Press, and Cold Brew without messy coffee ground retention.",
                "custom_specifications": {"Burrs": "64mm Gen 2 Stainless Steel", "Grind Settings": "31 Stepped Settings", "Motor": "Auto-Stop PID Feedback"},
                "variants_data": [
                    {"price": "24000", "compare_at_price": "27500", "stock_quantity": 18, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "24000", "compare_at_price": "27500", "stock_quantity": 14, "attributes": {"Primary Color": "Pure White"}},
                ]
            },
        ]
