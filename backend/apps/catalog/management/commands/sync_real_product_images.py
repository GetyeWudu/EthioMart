import json
import os
from django.core.management.base import BaseCommand
from apps.catalog.models import Product, ProductImage
from apps.catalog.services.taxonomy_service import TaxonomyService


class Command(BaseCommand):
    help = "Applies real user-uploaded Cloudinary product images to matching catalog products"

    def handle(self, *args, **options):
        mapping_path = os.path.join(os.path.dirname(__file__), "real_product_images_mapping.json")
        if not os.path.exists(mapping_path):
            self.stdout.write(self.style.ERROR(f"Mapping file not found at {mapping_path}"))
            return

        with open(mapping_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)

        updated_count = 0
        for title, p_info in mapping.items():
            slug = p_info.get("slug")
            images = p_info.get("images", [])
            if not images:
                continue

            # Look up product by slug or title
            clean_title = title.split(" (")[0].strip()
            product = (
                Product.all_objects.filter(slug=slug).first()
                or Product.all_objects.filter(title__iexact=title).first()
                or Product.all_objects.filter(title__icontains=clean_title).first()
            )

            if not product:
                # Try finding by title words
                words = [w for w in clean_title.split() if len(w) > 3]
                qs = Product.all_objects.all()
                for w in words:
                    qs = qs.filter(title__icontains=w)
                product = qs.first()

            if product:
                # Replace with real Cloudinary product images
                ProductImage.objects.filter(product=product).delete()

                for order, img_data in enumerate(images):
                    raw_url = img_data["url"]
                    # If full Cloudinary URL, store clean media relative path so it fits max_length 100
                    cl_prefix = "https://res.cloudinary.com/gechexpress/image/upload/v1/"
                    if raw_url.startswith(cl_prefix):
                        image_val = raw_url[len(cl_prefix):]
                    else:
                        image_val = raw_url

                    ProductImage.objects.create(
                        product=product,
                        image=image_val,
                        alt_text=product.title,
                        display_order=order,
                        is_primary=img_data.get("is_primary", order == 0)
                    )
                updated_count += 1
                self.stdout.write(f"Updated '{product.title}' with {len(images)} real image(s).")

        TaxonomyService.invalidate_cache()
        self.stdout.write(self.style.SUCCESS(f"Successfully synced real images for {updated_count} products."))
