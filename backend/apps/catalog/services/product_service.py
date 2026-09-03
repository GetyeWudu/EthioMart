import uuid
import logging
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.db import transaction
from django.utils.text import slugify
from django.db.models import Q
from apps.catalog.models import (
    Product,
    ProductVariant,
    ProductAttributeValue,
    ProductImage,
    Category,
    Brand,
    Attribute,
    AttributeValue,
)
from apps.catalog.enums import ProductStatus, ProductType, AttributeType
from apps.inventory.models import WarehouseLocation, WarehouseStock
from apps.inventory.services.inventory_service import InventoryService
from apps.inventory.enums import MovementType
from apps.vendors.models import VendorProfile
from apps.vendors.enums import VendorType, TrustTier

logger = logging.getLogger(__name__)


class ProductService:
    """
    Core domain service managing Product lifecycle, single-SKU auto-wrapping,
    variant matrix generation, and stock initialization.
    """

    @classmethod
    @transaction.atomic
    def create_simple_product(
        cls,
        vendor: VendorProfile,
        category: Category,
        title: str,
        price: Decimal,
        sku: Optional[str] = None,
        compare_at_price: Optional[Decimal] = None,
        cost_price: Optional[Decimal] = None,
        stock_quantity: int = 0,
        warehouse: Optional[WarehouseLocation] = None,
        brand: Optional[Brand] = None,
        short_description: str = "",
        description: str = "",
        weight_kg: Decimal = Decimal("0.500"),
        shipping_class: str = "STANDARD",
        length_cm: Decimal = Decimal("15.0"),
        width_cm: Decimal = Decimal("10.0"),
        height_cm: Decimal = Decimal("5.0"),
        specifications: Optional[List[Dict[str, Any]]] = None,
        custom_specifications: Optional[Dict[str, Any]] = None,
        suggested_category: str = "",
    ) -> Product:
        """
        Creates a Simple (single-SKU) Product and automatically wraps it in a default ProductVariant.
        Also automatically registers initial stock in the vendor's default warehouse.
        """
        if not category.is_leaf_node():
            raise ValueError(f"Category '{category.name}' has subcategories. Products must be attached to a terminal leaf node.")

        base_slug = slugify(title) or f"prod-{uuid.uuid4().hex[:8]}"
        unique_slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

        initial_status = ProductStatus.DRAFT
        if getattr(vendor, "vendor_type", VendorType.THIRD_PARTY) == VendorType.PLATFORM or getattr(vendor, "tier", TrustTier.PROBATION) == TrustTier.VIP:
            initial_status = ProductStatus.ACTIVE

        product = Product.objects.create(
            vendor=vendor,
            category=category,
            brand=brand,
            title=title,
            slug=unique_slug,
            short_description=short_description,
            description=description,
            product_type=ProductType.SIMPLE,
            status=initial_status,
            shipping_class=shipping_class or "STANDARD",
            length_cm=length_cm if length_cm is not None else Decimal("15.0"),
            width_cm=width_cm if width_cm is not None else Decimal("10.0"),
            height_cm=height_cm if height_cm is not None else Decimal("5.0"),
            custom_specifications=custom_specifications or {},
            suggested_category=suggested_category or "",
        )

        generated_sku = sku or f"SKU-{vendor.slug[:4].upper()}-{uuid.uuid4().hex[:6].upper()}"
        if ProductVariant.objects.filter(sku=generated_sku).exists():
            generated_sku = f"{generated_sku}-{uuid.uuid4().hex[:4].upper()}"

        variant = ProductVariant.objects.create(
            product=product,
            sku=generated_sku,
            price=price,
            compare_at_price=compare_at_price,
            cost_price=cost_price,
            weight_kg=weight_kg,
            is_default=True,
            is_active=True,
        )

        # Attach specifications if provided
        if specifications:
            for spec in specifications:
                attr = spec.get("attribute")
                attr_val = spec.get("attribute_value")
                custom_val = spec.get("custom_value", "")
                if attr:
                    ProductAttributeValue.objects.create(
                        product=product,
                        attribute=attr,
                        attribute_value=attr_val,
                        custom_value=custom_val,
                    )

        # Initialize stock in vendor's default or specified warehouse
        if warehouse:
            target_wh = warehouse
        else:
            target_wh = vendor.warehouses.filter(is_default=True).first() or vendor.warehouses.first()

        if not target_wh:
            target_wh = WarehouseLocation.objects.create(
                vendor=vendor,
                name=f"Main Facility - {vendor.store_name}",
                code=f"WH-{vendor.slug[:6].upper()}-01",
                city="Addis Ababa",
                is_default=True,
                is_active=True
            )

        if stock_quantity > 0:
            InventoryService.adjust_stock(
                warehouse=target_wh,
                variant=variant,
                quantity_delta=stock_quantity,
                movement_type=MovementType.PURCHASE_RECEIPT,
                notes="Initial simple product stock setup.",
            )
        else:
            WarehouseStock.objects.create(warehouse=target_wh, variant=variant, quantity_on_hand=0, quantity_reserved=0)

        logger.info(f"Created simple product '{product.title}' (SKU: {variant.sku}) for vendor {vendor.store_name}.")
        return product

    @classmethod
    @transaction.atomic
    def create_configurable_product(
        cls,
        vendor: VendorProfile,
        category: Category,
        title: str,
        brand: Optional[Brand] = None,
        short_description: str = "",
        description: str = "",
        shipping_class: str = "STANDARD",
        length_cm: Decimal = Decimal("15.0"),
        width_cm: Decimal = Decimal("10.0"),
        height_cm: Decimal = Decimal("5.0"),
        specifications: Optional[List[Dict[str, Any]]] = None,
        custom_specifications: Optional[Dict[str, Any]] = None,
        warehouse: Optional[WarehouseLocation] = None,
        variants_data: Optional[List[Dict[str, Any]]] = None,
        suggested_category: str = "",
    ) -> Product:
        """Creates a configurable multi-variant product parent."""
        if not category.is_leaf_node():
            raise ValueError(f"Category '{category.name}' has subcategories. Products must be attached to a terminal leaf node.")

        base_slug = slugify(title) or f"prod-{uuid.uuid4().hex[:8]}"
        unique_slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

        initial_status = ProductStatus.DRAFT
        if getattr(vendor, "vendor_type", VendorType.THIRD_PARTY) == VendorType.PLATFORM or getattr(vendor, "tier", TrustTier.PROBATION) == TrustTier.VIP:
            initial_status = ProductStatus.ACTIVE

        product = Product.objects.create(
            vendor=vendor,
            category=category,
            brand=brand,
            title=title,
            slug=unique_slug,
            short_description=short_description,
            description=description,
            product_type=ProductType.CONFIGURABLE_VARIANT,
            status=initial_status,
            shipping_class=shipping_class or "STANDARD",
            length_cm=length_cm if length_cm is not None else Decimal("15.0"),
            width_cm=width_cm if width_cm is not None else Decimal("10.0"),
            height_cm=height_cm if height_cm is not None else Decimal("5.0"),
            custom_specifications=custom_specifications or {},
            suggested_category=suggested_category or "",
        )

        if specifications:
            for spec in specifications:
                attr = spec.get("attribute")
                attr_val = spec.get("attribute_value")
                custom_val = spec.get("custom_value", "")
                if attr:
                    ProductAttributeValue.objects.create(
                        product=product,
                        attribute=attr,
                        attribute_value=attr_val,
                        custom_value=custom_val,
                    )

        if variants_data:
            if warehouse:
                target_wh = warehouse
            else:
                target_wh = vendor.warehouses.filter(is_default=True).first() or vendor.warehouses.first()

            if not target_wh:
                target_wh = WarehouseLocation.objects.create(
                    vendor=vendor,
                    name=f"Main Facility - {vendor.store_name}",
                    code=f"WH-{vendor.slug[:6].upper()}-01",
                    city="Addis Ababa",
                    is_default=True,
                    is_active=True
                )
                
            for index, row in enumerate(variants_data):
                sku = row.get("sku") or f"SKU-{vendor.slug[:4].upper()}-{uuid.uuid4().hex[:6].upper()}"
                if ProductVariant.objects.filter(sku=sku).exists():
                    sku = f"{sku}-{uuid.uuid4().hex[:4].upper()}"

                variant = ProductVariant.objects.create(
                    product=product,
                    sku=sku,
                    price=row.get("price", Decimal("0.00")),
                    compare_at_price=row.get("compare_at_price"),
                    cost_price=row.get("cost_price"),
                    weight_kg=row.get("weight_kg", Decimal("0.500")),
                    is_default=(index == 0),
                    is_active=True,
                )
                
                attr_value_ids = list(row.get("attribute_value_ids", []))
                
                labels = row.get("attribute_labels", {})
                if isinstance(labels, dict):
                    for attr_name, label_info in labels.items():
                        if not attr_name or not str(attr_name).strip():
                            continue
                        val_text = label_info.get("label", "").strip() if isinstance(label_info, dict) else str(label_info).strip()
                        if not val_text:
                            continue
                        
                        attr, _ = Attribute.objects.get_or_create(
                            name=str(attr_name).strip(),
                            defaults={'attribute_type': AttributeType.SELECT}
                        )
                        
                        attr_val = AttributeValue.objects.filter(
                            attribute=attr,
                            value__iexact=val_text
                        ).filter(Q(is_global=True) | Q(vendor=vendor)).first()
                        
                        if not attr_val:
                            attr_val = AttributeValue.objects.create(
                                attribute=attr,
                                value=val_text,
                                vendor=vendor,
                                is_global=False
                            )
                        
                        if attr_val.id not in attr_value_ids and str(attr_val.id) not in attr_value_ids:
                            attr_value_ids.append(attr_val.id)

                if attr_value_ids:
                    variant.attribute_values.set(attr_value_ids)
                    
                initial_stock = int(row.get("initial_stock", 0))
                if initial_stock > 0:
                    InventoryService.adjust_stock(
                        warehouse=target_wh,
                        variant=variant,
                        quantity_delta=initial_stock,
                        movement_type=MovementType.PURCHASE_RECEIPT,
                        notes="Initial product listing inventory receipt",
                    )
                else:
                    WarehouseStock.objects.create(warehouse=target_wh, variant=variant, quantity_on_hand=0, quantity_reserved=0)

        return product

    @classmethod
    @transaction.atomic
    def add_variant(
        cls,
        product: Product,
        sku: str,
        price: Decimal,
        attribute_values: List[AttributeValue],
        compare_at_price: Optional[Decimal] = None,
        cost_price: Optional[Decimal] = None,
        weight_kg: Decimal = Decimal("0.500"),
        is_default: bool = False,
    ) -> ProductVariant:
        """Adds a SKU variant to a configurable product."""
        if is_default:
            product.variants.filter(is_default=True).update(is_default=False)

        variant = ProductVariant.objects.create(
            product=product,
            sku=sku,
            price=price,
            compare_at_price=compare_at_price,
            cost_price=cost_price,
            weight_kg=weight_kg,
            is_default=is_default,
            is_active=True,
        )
        if attribute_values:
            variant.attribute_values.set(attribute_values)

        return variant

    @classmethod
    @transaction.atomic
    def delete_product(cls, product: Product) -> Dict[str, str]:
        """
        Safely deletes or archives a product based on transaction history.
        """
        from django.utils import timezone
        
        if product.can_be_hard_deleted():
            # No orders exist -> safe to hard delete
            product.hard_delete()
            return {"action": "PERMANENTLY_DELETED"}
        else:
            # Orders exist -> soft-delete / archive
            from apps.catalog.enums import ProductStatus
            product.status = ProductStatus.ARCHIVED
            # Append timestamp to slug to prevent unique constraint collisions for future listings
            product.slug = f"{product.slug}-archived-{int(timezone.now().timestamp())}"
            product.save(update_fields=['status', 'slug'])
            # Calling standard delete on BaseModel performs a soft delete (sets deleted_at)
            product.delete()
            return {"action": "ARCHIVED_SOFT_DELETED"}
