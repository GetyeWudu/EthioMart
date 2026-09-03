import logging
import urllib.request
import uuid
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils.text import slugify

from apps.catalog.models import Category, Brand, Attribute, AttributeValue, ProductImage
from apps.vendors.models import VendorProfile
from apps.vendors.enums import VendorStatus
from apps.catalog.services.product_service import ProductService

logger = logging.getLogger(__name__)
User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the store with 3 sellers, products, variants, and real placeholder images."

    def download_image(self, keyword):
        """Downloads a random realistic image based on keyword from picsum."""
        try:
            # Using picsum with a seed to get consistent but random-looking images
            url = f"https://picsum.photos/seed/{keyword}/800/800"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, timeout=10)
            return response.read()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Failed to download image for {keyword}: {e}"))
            return None

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Starting store seeding..."))
        
        try:
            with transaction.atomic():
                self._seed_sellers()
            self.stdout.write(self.style.SUCCESS("Store seeding completed successfully!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding store: {str(e)}"))
            raise e

    def _seed_sellers(self):
        sellers_data = [
            {
                "email": "getyewudu13@gmail.com",
                "store_name": "Tech Haven",
                "products": self._get_tech_products()
            },
            {
                "email": "getyewudu14@gmail.com",
                "store_name": "Style Boutique",
                "products": self._get_fashion_products()
            },
            {
                "email": "getyewudu15@gmail.com",
                "store_name": "Home Essentials",
                "products": self._get_home_products()
            }
        ]

        password = "Gech@123"

        for s_data in sellers_data:
            # 1. Create User
            user, created = User.objects.get_or_create(
                email=s_data["email"],
                defaults={
                    "first_name": s_data["store_name"].split()[0],
                    "last_name": "Store",
                    "role": "SELLER",
                    "is_email_verified": True
                }
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"Created user {user.email}")

            # 2. Create VendorProfile
            vendor, _ = VendorProfile.objects.get_or_create(
                user=user,
                defaults={
                    "store_name": s_data["store_name"],
                    "slug": slugify(s_data["store_name"]),
                    "status": VendorStatus.APPROVED
                }
            )

            # 3. Create Products
            for p_data in s_data["products"]:
                self._create_product(vendor, p_data)

    def _create_product(self, vendor, data):
        cat = Category.objects.filter(name=data["category"]).first()
        if not cat:
            self.stdout.write(self.style.WARNING(f"Category {data['category']} not found. Skipping {data['title']}"))
            return

        brand = Brand.objects.filter(name=data["brand"]).first() if "brand" in data else None

        # Prepare specs
        specs = data.get("specifications", [])
        custom_specs = data.get("custom_specifications", {})

        # Prepare variants data
        processed_variants = []
        if data.get("is_configurable") and data.get("variants_data"):
            for v_data in data["variants_data"]:
                attr_ids = []
                for attr_name, val_str in v_data.get("attributes", {}).items():
                    val_obj = AttributeValue.objects.filter(attribute__name=attr_name, value=val_str).first()
                    if val_obj:
                        attr_ids.append(val_obj.id)
                
                processed_variants.append({
                    "price": Decimal(v_data.get("price", "0.00")),
                    "compare_at_price": Decimal(v_data["compare_at_price"]) if v_data.get("compare_at_price") else None,
                    "initial_stock": v_data.get("stock_quantity", 0),
                    "attribute_value_ids": attr_ids
                })

        if data.get("is_configurable"):
            # Configurable product
            product = ProductService.create_configurable_product(
                vendor=vendor,
                category=cat,
                title=data["title"],
                brand=brand,
                short_description=data.get("short_description", "A great product."),
                description=data.get("description", "Detailed description here."),
                custom_specifications=custom_specs,
                variants_data=processed_variants
            )
        else:
            # Simple product
            product = ProductService.create_simple_product(
                vendor=vendor,
                category=cat,
                title=data["title"],
                price=Decimal(data["price"]),
                compare_at_price=Decimal(data.get("compare_at_price", 0)) or None,
                stock_quantity=data.get("stock", 50),
                brand=brand,
                short_description=data.get("short_description", "A great product."),
                description=data.get("description", "Detailed description here."),
                custom_specifications=custom_specs,
            )

        # Attach images
        self.stdout.write(f"Downloading image for {data['title']} ({data['image_keyword']})...")
        img_bytes = self.download_image(data["image_keyword"])
        if img_bytes:
            filename = f"{slugify(data['title'])}-{uuid.uuid4().hex[:6]}.jpg"
            ProductImage.objects.create(
                product=product,
                image=ContentFile(img_bytes, name=filename),
                is_primary=True
            )

    def _get_tech_products(self):
        return [
            {
                "title": "Apple MacBook Pro M3 Max",
                "category": "Laptops & Ultrabooks",
                "brand": "Apple",
                "is_configurable": True,
                "image_keyword": "macbook",
                "short_description": "Supercharged by M3 Max.",
                "description": "The most advanced Mac ever built for pros.",
                "custom_specifications": {"RAM": "32GB Unified Memory", "Processor": "Apple M3 Max", "Screen": "16-inch Liquid Retina XDR"},
                "variants_data": [
                    {"price": "180000", "stock_quantity": 10, "attributes": {"Capacity / Volume": "1 TB", "Primary Color": "Titanium Gray"}},
                    {"price": "165000", "stock_quantity": 5, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Titanium Gray"}},
                ]
            },
            {
                "title": "Samsung Galaxy S24 Ultra",
                "category": "Flagship Smartphones",
                "brand": "Samsung",
                "is_configurable": True,
                "image_keyword": "smartphone",
                "short_description": "Galaxy AI is here.",
                "description": "Welcome to the era of mobile AI.",
                "custom_specifications": {"Camera": "200MP Main", "Battery": "5000mAh", "Display": "6.8 inch AMOLED"},
                "variants_data": [
                    {"price": "95000", "compare_at_price": "105000", "stock_quantity": 20, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Midnight Black"}},
                    {"price": "95000", "stock_quantity": 15, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Titanium Gray"}},
                ]
            },
            {
                "title": "Dell XPS 15",
                "category": "Laptops & Ultrabooks",
                "brand": "Dell",
                "is_configurable": False,
                "price": "120000",
                "stock": 12,
                "image_keyword": "laptop",
                "short_description": "Masterpiece of design.",
                "custom_specifications": {"RAM": "16GB DDR5", "Processor": "Intel Core i7-13700H"}
            },
            {
                "title": "Sony WH-1000XM5",
                "category": "Noise-Cancelling Headphones",
                "brand": "Sony",
                "is_configurable": True,
                "image_keyword": "headphones",
                "short_description": "Industry leading noise cancellation.",
                "variants_data": [
                    {"price": "25000", "stock_quantity": 30, "attributes": {"Primary Color": "Midnight Black"}},
                    {"price": "25000", "stock_quantity": 10, "attributes": {"Primary Color": "Pure White"}},
                ]
            },
            {
                "title": "Apple iPhone 15 Pro",
                "category": "Flagship Smartphones",
                "brand": "Apple",
                "is_configurable": True,
                "image_keyword": "iphone",
                "short_description": "Titanium design.",
                "variants_data": [
                    {"price": "85000", "stock_quantity": 25, "attributes": {"Capacity / Volume": "256 GB", "Primary Color": "Titanium Gray"}},
                    {"price": "95000", "stock_quantity": 10, "attributes": {"Capacity / Volume": "512 GB", "Primary Color": "Titanium Gray"}},
                ]
            }
        ]

    def _get_fashion_products(self):
        return [
            {
                "title": "Hugo Boss Tailored Fit Suit",
                "category": "Men's Suits & Tuxedos",
                "brand": "Hugo Boss",
                "is_configurable": True,
                "image_keyword": "suit",
                "short_description": "Premium wool blend suit.",
                "custom_specifications": {"Material": "100% Virgin Wool", "Fit": "Tailored"},
                "variants_data": [
                    {"price": "45000", "stock_quantity": 5, "attributes": {"Size": "Medium (M)", "Primary Color": "Navy Blue"}},
                    {"price": "45000", "stock_quantity": 3, "attributes": {"Size": "Large (L)", "Primary Color": "Navy Blue"}},
                    {"price": "45000", "stock_quantity": 2, "attributes": {"Size": "Large (L)", "Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Zara Silk Evening Gown",
                "category": "Women's Dresses & Gowns",
                "brand": "Zara",
                "is_configurable": True,
                "image_keyword": "gown",
                "short_description": "Elegant silk evening wear.",
                "custom_specifications": {"Material": "100% Silk", "Care": "Dry Clean Only"},
                "variants_data": [
                    {"price": "18000", "stock_quantity": 8, "attributes": {"Size": "Small (S)", "Primary Color": "Crimson Red"}},
                    {"price": "18000", "stock_quantity": 12, "attributes": {"Size": "Medium (M)", "Primary Color": "Crimson Red"}},
                ]
            },
            {
                "title": "Nike Air Zoom Pegasus 40",
                "category": "Running & Sports Sneakers",
                "brand": "Nike",
                "is_configurable": True,
                "image_keyword": "sneakers",
                "short_description": "Responsive everyday running shoe.",
                "custom_specifications": {"Sole": "Rubber", "Usage": "Road Running"},
                "variants_data": [
                    {"price": "8500", "stock_quantity": 20, "attributes": {"Shoe Size (EU)": "42", "Primary Color": "Midnight Black"}},
                    {"price": "8500", "stock_quantity": 15, "attributes": {"Shoe Size (EU)": "43", "Primary Color": "Midnight Black"}},
                    {"price": "8500", "stock_quantity": 10, "attributes": {"Shoe Size (EU)": "42", "Primary Color": "Pure White"}},
                ]
            },
            {
                "title": "Adidas Ultraboost Light",
                "category": "Running & Sports Sneakers",
                "brand": "Adidas",
                "is_configurable": True,
                "image_keyword": "sneaker",
                "variants_data": [
                    {"price": "9200", "stock_quantity": 22, "attributes": {"Shoe Size (EU)": "41", "Primary Color": "Pure White"}},
                    {"price": "9200", "stock_quantity": 18, "attributes": {"Shoe Size (EU)": "44", "Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Gymshark Vital Seamless Set",
                "category": "Activewear Sets",
                "brand": "Gymshark",
                "is_configurable": True,
                "image_keyword": "activewear",
                "variants_data": [
                    {"price": "5500", "stock_quantity": 30, "attributes": {"Size": "Small (S)", "Primary Color": "Navy Blue"}},
                    {"price": "5500", "stock_quantity": 25, "attributes": {"Size": "Medium (M)", "Primary Color": "Emerald Green"}},
                ]
            }
        ]

    def _get_home_products(self):
        return [
            {
                "title": "De'Longhi Magnifica Espresso Machine",
                "category": "Coffee & Espresso Machines",
                "brand": "De'Longhi",
                "is_configurable": True,
                "image_keyword": "espresso",
                "short_description": "Bean-to-cup espresso machine.",
                "custom_specifications": {"Power": "1450 W", "Pump Pressure": "15 bar"},
                "variants_data": [
                    {"price": "35000", "stock_quantity": 10, "attributes": {"Capacity / Volume": "1 Litre", "Primary Color": "Midnight Black"}},
                    {"price": "35000", "stock_quantity": 5, "attributes": {"Capacity / Volume": "1 Litre", "Primary Color": "Titanium Gray"}},
                ]
            },
            {
                "title": "Philips High Speed Blender",
                "category": "Blenders & Juicers",
                "brand": "Philips",
                "is_configurable": True,
                "image_keyword": "blender",
                "variants_data": [
                    {"price": "18000", "stock_quantity": 15, "attributes": {"Capacity / Volume": "1 Litre", "Primary Color": "Midnight Black"}},
                ]
            },
            {
                "title": "Modern Fabric Sofa",
                "category": "Fabric Sofas & Couches",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_keyword": "sofa",
                "variants_data": [
                    {"price": "45000", "stock_quantity": 3, "attributes": {"Size": "Large (L)", "Primary Color": "Titanium Gray"}},
                    {"price": "55000", "stock_quantity": 2, "attributes": {"Size": "Extra Large (XL)", "Primary Color": "Navy Blue"}},
                ]
            },
            {
                "title": "Nespresso Vertuo Next",
                "category": "Coffee & Espresso Machines",
                "brand": "Nespresso",
                "is_configurable": True,
                "image_keyword": "coffee",
                "variants_data": [
                    {"price": "12000", "stock_quantity": 20, "attributes": {"Capacity / Volume": "1 Litre", "Primary Color": "Crimson Red"}},
                ]
            },
            {
                "title": "Persian Style Living Room Rug",
                "category": "Persian Style Rugs",
                "brand": "Generic / Unbranded",
                "is_configurable": True,
                "image_keyword": "rug",
                "variants_data": [
                    {"price": "8500", "stock_quantity": 12, "attributes": {"Size": "Large (L)", "Primary Color": "Crimson Red"}},
                ]
            }
        ]
