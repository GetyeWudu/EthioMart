import os
import random
from apps.catalog.models import Product, ProductImage
from django.core.files.base import ContentFile

media_dir = '/app/media/products/2026/09/'
images = [f for f in os.listdir(media_dir) if f.endswith('.jpg')]

products_without_images = Product.objects.filter(images__isnull=True)
count = 0

for p in products_without_images:
    if not images:
        break
    img_name = random.choice(images)
    ProductImage.objects.create(
        product=p,
        image=f'products/2026/09/{img_name}',
        is_primary=True,
        display_order=0
    )
    count += 1

print(f'Assigned real images to {count} products!')
