from rest_framework import serializers
from apps.inventory.models import (
    WarehouseLocation,
    WarehouseStock,
    StockMovement,
)
from apps.inventory.enums import MovementType, StaffRole


class WarehouseLocationSerializer(serializers.ModelSerializer):
    sku_count = serializers.SerializerMethodField()
    total_units = serializers.SerializerMethodField()

    class Meta:
        model = WarehouseLocation
        fields = [
            "id",
            "name",
            "code",
            "city",
            "subcity",
            "wereda",
            "street_address",
            "latitude",
            "longitude",
            "contact_name",
            "contact_phone",
            "is_active",
            "is_default",
            "is_pickup_point",
            "created_at",
            "sku_count",
            "total_units",
        ]

    def get_sku_count(self, obj):
        return obj.stocks.values("variant_id").distinct().count()

    def get_total_units(self, obj):
        from django.db.models import Sum
        return obj.stocks.aggregate(total=Sum("quantity_on_hand"))["total"] or 0


class WarehouseCreateSerializer(serializers.ModelSerializer):
    code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=True)
    subcity = serializers.CharField(max_length=100, required=False, allow_blank=True)
    wereda = serializers.CharField(max_length=50, required=False, allow_blank=True)
    street_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    contact_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    class Meta:
        model = WarehouseLocation
        fields = [
            "name",
            "code",
            "city",
            "subcity",
            "wereda",
            "street_address",
            "latitude",
            "longitude",
            "contact_name",
            "contact_phone",
            "is_default",
            "is_pickup_point",
        ]

    def validate(self, attrs):
        if not attrs.get("name"):
            raise serializers.ValidationError({"name": "This field is required."})
        if not attrs.get("city"):
            raise serializers.ValidationError({"city": "This field is required."})
            
        import uuid
        if not attrs.get("code"):
            city_prefix = attrs.get("city", "ADD")[:3].upper()
            attrs["code"] = f"WH-{city_prefix}-{uuid.uuid4().hex[:4].upper()}"
            
        return attrs


class WarehouseStockSerializer(serializers.ModelSerializer):
    warehouse_id = serializers.UUIDField(source="warehouse.id", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    warehouse_code = serializers.CharField(source="warehouse.code", read_only=True)
    product_id = serializers.UUIDField(source="variant.product.id", read_only=True)
    product_title = serializers.CharField(source="variant.product.title", read_only=True)
    variant_id = serializers.UUIDField(source="variant.id", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    variant_attributes = serializers.SerializerMethodField()
    variant_price = serializers.DecimalField(source="variant.price", max_digits=12, decimal_places=2, read_only=True)
    quantity_available = serializers.IntegerField(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = WarehouseStock
        fields = [
            "id",
            "product_id",
            "product_title",
            "variant_id",
            "sku",
            "variant_attributes",
            "warehouse_id",
            "warehouse_name",
            "warehouse_code",
            "variant_price",
            "quantity_on_hand",
            "quantity_reserved",
            "quantity_available",
            "low_stock_threshold",
            "aisle_location",
            "status",
            "updated_at",
        ]

    def get_variant_attributes(self, obj):
        if not obj.variant.attribute_values.exists():
            return "Default"
        attrs = [f"{av.attribute.name}: {av.value}" for av in obj.variant.attribute_values.all()]
        return " / ".join(attrs)

    def get_status(self, obj):
        avail = obj.quantity_available
        if avail <= 0:
            return "OUT_OF_STOCK"
        elif avail <= obj.low_stock_threshold:
            return "LOW_STOCK"
        return "IN_STOCK"


class StockAdjustmentSerializer(serializers.Serializer):
    warehouse_id = serializers.UUIDField()
    variant_id = serializers.UUIDField()
    quantity_delta = serializers.IntegerField()
    movement_type = serializers.ChoiceField(
        choices=MovementType.choices,
        default=MovementType.MANUAL_ADJUSTMENT
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class StockTransferSerializer(serializers.Serializer):
    source_warehouse_id = serializers.UUIDField()
    target_warehouse_id = serializers.UUIDField()
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class StockMovementSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)
    product_title = serializers.CharField(source="variant.product.title", read_only=True, default="Unknown Product")
    variant_name = serializers.CharField(source="variant.name", read_only=True, default=None)
    performed_by_name = serializers.CharField(source="performed_by.email", read_only=True, default=None)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "warehouse_name",
            "variant_sku",
            "product_title",
            "variant_name",
            "movement_type",
            "quantity_delta",
            "balance_after",
            "reference_order_id",
            "notes",
            "performed_by_name",
            "created_at",
        ]

