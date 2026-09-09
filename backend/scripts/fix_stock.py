from apps.catalog.models import ProductVariant
from apps.inventory.models import WarehouseStock, WarehouseLocation

variants = ProductVariant.objects.all()
count = 0
for v in variants:
    w = WarehouseLocation.objects.filter(vendor=v.product.vendor).first()
    if w:
        s, _ = WarehouseStock.objects.get_or_create(variant=v, warehouse=w)
        s.quantity_on_hand = 100
        s.save()
        count += 1
print(f'Updated stock for {count} variants.')
