import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.catalog.models import Category, Product
from apps.catalog.services.taxonomy_service import TaxonomyService

for cat in Category.objects.all():
    descendant_ids = [n.id for n in cat.get_descendants()] + [cat.id]
    product_count = Product.objects.filter(category_id__in=descendant_ids).count()
    if product_count == 0:
        print(f"Deleting category {cat.name} because it has 0 products")
        cat.delete()

TaxonomyService.invalidate_cache()
print("Cache invalidated.")
