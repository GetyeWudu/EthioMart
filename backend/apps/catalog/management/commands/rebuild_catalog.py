from django.core.management.base import BaseCommand
from django.db import transaction
from apps.catalog.models import Category, Attribute, AttributeValue, CategoryAttribute
from apps.catalog.enums import AttributeType

class Command(BaseCommand):
    help = 'Rebuilds the catalog attributes using mid-level binding mapping to existing categories.'

    def handle(self, *args, **options):
        self.stdout.write("Starting catalog rebuild mapping to real categories...")

        with transaction.atomic():
            # 1. Clean Sweep attributes & bindings
            CategoryAttribute.objects.all().delete()
            AttributeValue.objects.all().delete()
            Attribute.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("Cleaned all previous attribute bindings."))

            # Helper to find category by slug
            def get_cat(slug):
                try:
                    return Category.objects.get(slug=slug)
                except Category.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Category with slug '{slug}' not found!"))
                    return None

            # Helper to bind attribute
            def bind_attribute(category, attr_name, attr_type, is_variant=False, is_required=False, values=None):
                if not category:
                    return None
                
                attr, _ = Attribute.objects.get_or_create(
                    name=attr_name,
                    defaults={'attribute_type': attr_type}
                )
                
                CategoryAttribute.objects.get_or_create(
                    category=category,
                    attribute=attr,
                    defaults={
                        'is_variant_creator': is_variant,
                        'is_required': is_required,
                        'is_filterable': True,
                    }
                )

                if values:
                    for val in values:
                        if isinstance(val, dict):
                            AttributeValue.objects.get_or_create(
                                attribute=attr,
                                value=val['value'],
                                defaults={'is_global': True, 'color_code': val.get('color_code', '')}
                            )
                        else:
                            AttributeValue.objects.get_or_create(
                                attribute=attr,
                                value=str(val),
                                defaults={'is_global': True}
                            )
                return attr

            # Color values
            standard_colors = [
                {'value': 'Black', 'color_code': '#000000'},
                {'value': 'White', 'color_code': '#FFFFFF'},
                {'value': 'Blue', 'color_code': '#2563EB'},
                {'value': 'Red', 'color_code': '#DC2626'},
                {'value': 'Silver', 'color_code': '#9CA3AF'},
                {'value': 'Gray', 'color_code': '#4B5563'},
                {'value': 'Gold', 'color_code': '#F59E0B'},
            ]

            # ----------------------------------------------------
            # 1. CONSUMER ELECTRONICS
            # ----------------------------------------------------
            consumer_electronics = get_cat("consumer-electronics")
            if consumer_electronics:
                bind_attribute(consumer_electronics, "Condition", AttributeType.SELECT, is_variant=False, is_required=True, values=["Brand New", "Refurbished", "Used - Like New", "Used - Good"])
                bind_attribute(consumer_electronics, "Warranty Period", AttributeType.SELECT, is_variant=False, is_required=False, values=["No Warranty", "6 Months", "1 Year", "2 Years"])
                bind_attribute(consumer_electronics, "Primary Color", AttributeType.SELECT, is_variant=True, is_required=False, values=standard_colors)

            # Computing & Laptops (Mid-Level)
            comp_laptops = get_cat("computing-laptops")
            if comp_laptops:
                bind_attribute(comp_laptops, "RAM", AttributeType.SELECT, is_variant=True, is_required=False, values=["4GB", "8GB", "16GB", "32GB", "64GB"])
                bind_attribute(comp_laptops, "Storage Capacity", AttributeType.SELECT, is_variant=True, is_required=False, values=["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"])
                bind_attribute(comp_laptops, "Operating System", AttributeType.SELECT, is_variant=False, is_required=False, values=["Windows 11", "Windows 10", "macOS", "Linux", "ChromeOS"])

            # Laptops & Ultrabooks (Leaf)
            laptops_leaf = get_cat("laptops-ultrabooks")
            if laptops_leaf:
                bind_attribute(laptops_leaf, "Screen Size", AttributeType.SELECT, is_variant=False, is_required=False, values=["13.3 inch", "14.0 inch", "15.6 inch", "16.0 inch", "17.3 inch"])
                bind_attribute(laptops_leaf, "Battery Capacity", AttributeType.TEXT, is_variant=False, is_required=False)

            # Audio & Headphones (Mid-Level)
            audio = get_cat("audio-headphones")
            if audio:
                bind_attribute(audio, "Connectivity Type", AttributeType.SELECT, is_variant=False, is_required=False, values=["Bluetooth / Wireless", "Wired (3.5mm)", "USB-C", "Lightning"])
                bind_attribute(audio, "Headphone Fit", AttributeType.SELECT, is_variant=False, is_required=False, values=["Over-Ear", "On-Ear", "In-Ear", "Earbuds"])

            # Cameras & Photography (Mid-Level)
            cameras = get_cat("cameras-photography")
            if cameras:
                bind_attribute(cameras, "Megapixel Count", AttributeType.SELECT, is_variant=False, is_required=False, values=["12MP", "24MP", "33MP", "45MP", "60MP+"])
                bind_attribute(cameras, "Lens Mount Type", AttributeType.SELECT, is_variant=False, is_required=False, values=["Canon RF", "Sony E-Mount", "Nikon Z", "Fujifilm X", "Micro Four Thirds"])

            # ----------------------------------------------------
            # 2. MOBILE PHONES & TABLETS
            # ----------------------------------------------------
            mobiles = get_cat("mobile-phones-tablets")
            if mobiles:
                bind_attribute(mobiles, "Condition", AttributeType.SELECT, is_variant=False, is_required=True, values=["Brand New", "Refurbished", "Used - Like New"])
                bind_attribute(mobiles, "Primary Color", AttributeType.SELECT, is_variant=True, is_required=False, values=standard_colors)
                bind_attribute(mobiles, "Storage Capacity", AttributeType.SELECT, is_variant=True, is_required=False, values=["64GB", "128GB", "256GB", "512GB", "1TB"])

            wearables = get_cat("wearable-technology")
            if wearables:
                bind_attribute(wearables, "Band Material", AttributeType.SELECT, is_variant=False, is_required=False, values=["Silicone", "Stainless Steel", "Leather", "Nylon / Fabric"])
                bind_attribute(wearables, "Case Size", AttributeType.SELECT, is_variant=True, is_required=False, values=["40mm", "41mm", "42mm", "44mm", "45mm", "49mm"])

            # ----------------------------------------------------
            # 3. FOOTWEAR & SHOES
            # ----------------------------------------------------
            footwear = get_cat("footwear-shoes")
            if footwear:
                bind_attribute(footwear, "Primary Color", AttributeType.SELECT, is_variant=True, is_required=False, values=standard_colors)
                bind_attribute(footwear, "Shoe Size (EU)", AttributeType.SELECT, is_variant=True, is_required=False, values=[str(i) for i in range(36, 47)])
                bind_attribute(footwear, "Upper Material", AttributeType.SELECT, is_variant=False, is_required=False, values=["Genuine Leather", "Synthetic Leather", "Mesh / Fabric", "Canvas", "Suede"])

            # ----------------------------------------------------
            # 4. FASHION & APPAREL
            # ----------------------------------------------------
            fashion = get_cat("fashion-apparel")
            if fashion:
                bind_attribute(fashion, "Primary Color", AttributeType.SELECT, is_variant=True, is_required=False, values=standard_colors)
                bind_attribute(fashion, "Fabric / Material", AttributeType.SELECT, is_variant=False, is_required=False, values=["100% Cotton", "Polyester", "Silk", "Denim", "Wool", "Linen"])

            mens_clothing = get_cat("mens-clothing")
            if mens_clothing:
                bind_attribute(mens_clothing, "Clothing Size", AttributeType.SELECT, is_variant=True, is_required=False, values=["XS", "S", "M", "L", "XL", "XXL", "3XL"])

            womens_clothing = get_cat("womens-clothing")
            if womens_clothing:
                bind_attribute(womens_clothing, "Clothing Size", AttributeType.SELECT, is_variant=True, is_required=False, values=["XS", "S", "M", "L", "XL", "XXL"])

            # ----------------------------------------------------
            # 5. HOME & KITCHEN / FURNITURE
            # ----------------------------------------------------
            home = get_cat("home-kitchen")
            if home:
                bind_attribute(home, "Primary Color", AttributeType.SELECT, is_variant=True, is_required=False, values=standard_colors)

            furniture = get_cat("furniture")
            if furniture:
                bind_attribute(furniture, "Dimensions / Size", AttributeType.SELECT, is_variant=True, is_required=False, values=["1200mm x 2000mm", "1500mm x 2000mm", "1800mm x 2000mm", "2000mm x 2200mm"])

            # Clean duplicate orphaned tree if empty
            try:
                dup_elec = Category.objects.filter(slug="electronics", products__isnull=True).first()
                if dup_elec:
                    dup_elec.delete()
            except Exception:
                pass

            self.stdout.write(self.style.SUCCESS("Successfully mapped and rebuilt catalog for all standard categories!"))
