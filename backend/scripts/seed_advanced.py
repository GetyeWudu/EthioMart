import os
import sys
import django
import urllib.request
import uuid
from django.core.files.base import ContentFile
from decimal import Decimal
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.users.models import CustomUser
from apps.vendors.models import VendorProfile, VendorStatus, BusinessType
from apps.catalog.models import (
    Category, Product, ProductVariant, ProductImage,
    Attribute, AttributeValue, CategoryAttribute, ProductAttributeValue
)
from apps.catalog.enums import ProductStatus, ProductType, AttributeType

def download_image(url, filename):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        return ContentFile(response.read(), name=filename)
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
        return None

def seed_database():
    print("Starting advanced seed...")

    # --- 1. Create Sellers ---
    sellers_data = [
        ("tech_hub@example.com", "Tech Hub Electronics"),
        ("fashion_nova@example.com", "Fashion Nova Style"),
        ("home_essentials@example.com", "Home Essentials"),
        ("beauty_bliss@example.com", "Beauty Bliss")
    ]
    vendors = []
    for email, store_name in sellers_data:
        user, _ = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                "first_name": store_name.split()[0],
                "last_name": "Seller",
                "role": CustomUser.Role.SELLER,
                "is_active": True,
            }
        )
        user.set_password("Password@123")
        user.save()
        
        vendor, _ = VendorProfile.objects.get_or_create(
            user=user,
            defaults={
                "store_name": store_name,
                "status": VendorStatus.APPROVED,
                "business_type": BusinessType.INDIVIDUAL,
                "contact_email": email,
                "is_verified": True,
            }
        )
        vendors.append(vendor)

    # --- 2. Create Categories ---
    categories_data = ["Electronics", "Fashion", "Home & Kitchen", "Health & Beauty"]
    categories = {}
    for name in categories_data:
        try:
            cat = Category.objects.get(name=name)
        except Category.DoesNotExist:
            from django.utils.text import slugify
            cat = Category.add_root(name=name, slug=slugify(name), is_active=True)
        categories[name] = cat

    # --- 3. Create Attributes ---
    # Global Attributes
    attr_color, _ = Attribute.objects.get_or_create(name="Color", defaults={"attribute_type": AttributeType.SELECT})
    attr_size, _ = Attribute.objects.get_or_create(name="Size", defaults={"attribute_type": AttributeType.SELECT})
    attr_storage, _ = Attribute.objects.get_or_create(name="Storage", defaults={"attribute_type": AttributeType.SELECT})

    # Bind to Categories
    CategoryAttribute.objects.get_or_create(category=categories["Fashion"], attribute=attr_color, is_variant_creator=True)
    CategoryAttribute.objects.get_or_create(category=categories["Fashion"], attribute=attr_size, is_variant_creator=True)
    CategoryAttribute.objects.get_or_create(category=categories["Electronics"], attribute=attr_color, is_variant_creator=True)
    CategoryAttribute.objects.get_or_create(category=categories["Electronics"], attribute=attr_storage, is_variant_creator=True)

    # Values
    colors = ["Black", "White", "Blue", "Red", "Silver"]
    color_vals = {c: AttributeValue.objects.get_or_create(attribute=attr_color, value=c)[0] for c in colors}
    
    sizes = ["S", "M", "L", "XL"]
    size_vals = {s: AttributeValue.objects.get_or_create(attribute=attr_size, value=s)[0] for s in sizes}

    storages = ["64GB", "128GB", "256GB"]
    storage_vals = {s: AttributeValue.objects.get_or_create(attribute=attr_storage, value=s)[0] for s in storages}


    # --- 4. Product Data (45 Products) ---
    # To avoid writing 45 individual lines, we generate them systematically
    products_seed = []
    
    # Electronics (12 products)
    elec_images = [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
        "https://images.unsplash.com/photo-1610945265064-3234dac15053?w=800&q=80",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80",
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80",
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=800&q=80",
        "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80",
        "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80",
        "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=800&q=80",
        "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&q=80",
    ]
    elec_names = ["Pro Smartphone", "Galaxy Phone X", "Smart Watch V2", "Wireless Earbuds", "Gaming Laptop", "Business Laptop", "Bluetooth Headphones", "Smart Speaker", "Tablet Pro 10", "4K Monitor", "Mechanical Keyboard", "Wireless Mouse"]
    
    for i in range(12):
        products_seed.append({
            "title": elec_names[i],
            "category": "Electronics",
            "vendor": vendors[0],
            "price": random.randint(1000, 50000),
            "image": elec_images[i],
            "variants": {"Storage": random.sample(storages, 2), "Color": random.sample(colors, 2)}
        })

    # Fashion (12 products)
    fash_images = [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
        "https://images.unsplash.com/photo-1596755094514-f87e32f85e13?w=800&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80",
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80",
        "https://images.unsplash.com/photo-1588099768531-a72d4a198538?w=800&q=80",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
        "https://images.unsplash.com/photo-1489987707023-afc232d7ea34?w=800&q=80",
    ]
    fash_names = ["Cotton T-Shirt", "Leather Jacket", "Running Shoes", "Casual Shirt", "Summer Dress", "Leather Boots", "Winter Coat", "Silk Scarf", "Denim Jeans", "Formal Shoes", "Graphic Tee", "Wool Sweater"]
    for i in range(12):
        products_seed.append({
            "title": fash_names[i],
            "category": "Fashion",
            "vendor": vendors[1],
            "price": random.randint(500, 5000),
            "image": fash_images[i],
            "variants": {"Size": random.sample(sizes, 3), "Color": random.sample(colors, 2)}
        })

    # Home & Kitchen (11 products)
    home_images = [
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80",
        "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80",
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
        "https://images.unsplash.com/photo-1581699924510-7fa988944d1f?w=800&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
        "https://images.unsplash.com/photo-1571216954203-9bb6447c2114?w=800&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
        "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80",
        "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80",
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
        "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&q=80",
    ]
    home_names = ["Ceramic Mug", "Cookware Set", "Blender 500W", "Toaster Oven", "Dining Set", "Sofa Cushion", "Modern Chair", "Luxury Sofa", "Vase Set", "Table Lamp", "Wall Mirror"]
    for i in range(11):
        products_seed.append({
            "title": home_names[i],
            "category": "Home & Kitchen",
            "vendor": vendors[2],
            "price": random.randint(300, 15000),
            "image": home_images[i],
            "variants": {}
        })

    # Health & Beauty (10 products)
    beauty_images = [
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80",
        "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80",
        "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800&q=80",
        "https://images.unsplash.com/photo-1556228720-192a6af4e865?w=800&q=80",
        "https://images.unsplash.com/photo-1512496015851-a1cbf3480fe3?w=800&q=80",
        "https://images.unsplash.com/photo-1590156546946-cb56041ef0ab?w=800&q=80",
        "https://images.unsplash.com/photo-1615397323209-6ee1f753c155?w=800&q=80",
    ]
    beauty_names = ["Facial Cleanser", "Moisturizing Cream", "Lipstick Set", "Hair Serum", "Body Lotion", "Sunscreen SPF 50", "Face Mask", "Perfume 100ml", "Essential Oil", "Makeup Brushes"]
    for i in range(10):
        products_seed.append({
            "title": beauty_names[i],
            "category": "Health & Beauty",
            "vendor": vendors[3],
            "price": random.randint(200, 3000),
            "image": beauty_images[i],
            "variants": {}
        })

    # --- 5. Generate Database Records ---
    print(f"Total products to seed: {len(products_seed)}")
    for data in products_seed:
        title = data["title"]
        # Skip if already exists
        if Product.objects.filter(title=title).exists():
            continue

        category = categories[data["category"]]
        vendor = data["vendor"]
        price = data["price"]
        variants = data["variants"]
        
        # Create Product
        from django.utils.text import slugify
        product = Product.objects.create(
            vendor=vendor,
            category=category,
            title=title,
            slug=f"{slugify(title)}-{uuid.uuid4().hex[:6]}",
            description=f"High quality {title} carefully selected for our marketplace.",
            short_description=f"Premium {title}",
            product_type=ProductType.CONFIGURABLE_VARIANT if variants else ProductType.SIMPLE,
            status=ProductStatus.ACTIVE,
            is_featured=True
        )
        print(f"Created Product: {title}")

        # Download primary image
        img_content = download_image(data["image"], f"{uuid.uuid4().hex[:8]}.jpg")

        if not variants:
            # Simple Product
            variant = ProductVariant.objects.create(
                product=product,
                sku=f"{title[:3].upper()}-{uuid.uuid4().hex[:4]}",
                price=Decimal(str(price)),
                is_default=True,
                is_active=True
            )
            if img_content:
                ProductImage.objects.create(product=product, variant=variant, is_primary=True, image=img_content)
        else:
            # Configurable Product (Multiple Variants)
            first_variant = True
            keys = list(variants.keys())
            
            # Simple combination generator (max 2 attributes usually)
            if len(keys) == 1:
                vals = variants[keys[0]]
                for v in vals:
                    variant = ProductVariant.objects.create(
                        product=product,
                        sku=f"{title[:3].upper()}-{v}-{uuid.uuid4().hex[:3]}",
                        price=Decimal(str(price + random.randint(0, 100))), # slight price variation
                        is_default=first_variant,
                        is_active=True
                    )
                    # Assign attribute value
                    if keys[0] == "Color":
                        variant.attribute_values.add(color_vals[v])
                    elif keys[0] == "Size":
                        variant.attribute_values.add(size_vals[v])
                    elif keys[0] == "Storage":
                        variant.attribute_values.add(storage_vals[v])

                    if first_variant and img_content:
                        ProductImage.objects.create(product=product, variant=variant, is_primary=True, image=img_content)
                    first_variant = False
            elif len(keys) == 2:
                # E.g. Color and Storage
                for v1 in variants[keys[0]]:
                    for v2 in variants[keys[1]]:
                        variant = ProductVariant.objects.create(
                            product=product,
                            sku=f"{title[:3].upper()}-{v1}-{v2}-{uuid.uuid4().hex[:3]}",
                            price=Decimal(str(price + random.randint(0, 100))),
                            is_default=first_variant,
                            is_active=True
                        )
                        # Add attr 1
                        if keys[0] == "Color": variant.attribute_values.add(color_vals[v1])
                        elif keys[0] == "Size": variant.attribute_values.add(size_vals[v1])
                        elif keys[0] == "Storage": variant.attribute_values.add(storage_vals[v1])
                        # Add attr 2
                        if keys[1] == "Color": variant.attribute_values.add(color_vals[v2])
                        elif keys[1] == "Size": variant.attribute_values.add(size_vals[v2])
                        elif keys[1] == "Storage": variant.attribute_values.add(storage_vals[v2])

                        if first_variant and img_content:
                            ProductImage.objects.create(product=product, variant=variant, is_primary=True, image=img_content)
                        first_variant = False

    print("Seed completed successfully! Generated 45 products with variants and real images.")

if __name__ == "__main__":
    seed_database()
