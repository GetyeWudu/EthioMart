from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.vendors.services.vendor_service import VendorService
from apps.common.permissions import IsVendorStaffWithFacilityAccess, IsAdminUser
from apps.inventory.models import (
    WarehouseLocation,
    WarehouseStock,
    StockMovement,
)
from apps.inventory.services.warehouse_service import WarehouseService
from apps.inventory.services.inventory_service import InventoryService
from apps.inventory.serializers import (
    WarehouseLocationSerializer,
    WarehouseCreateSerializer,
    WarehouseStockSerializer,
    StockAdjustmentSerializer,
    StockTransferSerializer,
    StockMovementSerializer,
)
from apps.catalog.models import ProductVariant
from apps.users.models import CustomUser


class SellerWarehouseListCreateAPIView(APIView):
    """Lists and creates physical warehouse facilities for the authenticated vendor."""
    permission_classes = [IsAuthenticated, IsVendorStaffWithFacilityAccess]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        warehouses = WarehouseLocation.objects.filter(vendor=vendor)
        if not warehouses.exists():
            WarehouseService.create_warehouse(
                vendor=vendor,
                name="Main Facility",
                code=f"WH-{vendor.slug[:8].upper()}-01",
                city=vendor.city or "Addis Ababa",
                street_address="To be updated",
                is_default=True,
            )
            warehouses = WarehouseLocation.objects.filter(vendor=vendor)

        serializer = WarehouseLocationSerializer(warehouses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = WarehouseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        warehouse = WarehouseService.create_warehouse(
            vendor=vendor,
            name=data["name"],
            code=data["code"],
            city=data["city"],
            street_address=data["street_address"],
            subcity=data.get("subcity", ""),
            wereda=data.get("wereda", ""),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            contact_name=data.get("contact_name", ""),
            contact_phone=data.get("contact_phone", ""),
            is_default=data.get("is_default", False),
            is_pickup_point=data.get("is_pickup_point", False),
        )
        return Response(WarehouseLocationSerializer(warehouse).data, status=status.HTTP_201_CREATED)


class SellerWarehouseDetailAPIView(APIView):
    """Views and updates a physical warehouse facility."""
    permission_classes = [IsAuthenticated, IsVendorStaffWithFacilityAccess]

    def get_queryset(self):
        vendor = VendorService.get_or_create_profile(self.request.user)
        qs = WarehouseLocation.objects.filter(vendor=vendor)
        staff = self.request.user.vendor_staff_roles.filter(is_active=True).first()
        if staff and staff.assigned_facility_id:
            qs = qs.filter(id=staff.assigned_facility_id)
        return qs

    def get(self, request, pk):
        warehouse = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = WarehouseLocationSerializer(warehouse)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        warehouse = get_object_or_404(WarehouseLocation, pk=pk, vendor=vendor)

        for field in ["name", "city", "subcity", "wereda", "street_address", "contact_name", "contact_phone", "is_active", "is_pickup_point"]:
            if field in request.data:
                setattr(warehouse, field, request.data[field])

        if "is_default" in request.data and request.data["is_default"]:
            WarehouseLocation.objects.filter(vendor=vendor, is_default=True).update(is_default=False)
            warehouse.is_default = True

        warehouse.save()
        return Response(WarehouseLocationSerializer(warehouse).data, status=status.HTTP_200_OK)


class SellerWarehouseSetPrimaryAPIView(APIView):
    """Sets a warehouse facility as the primary/default for the vendor."""
    permission_classes = [IsAuthenticated, IsVendorStaffWithFacilityAccess]

    def post(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        warehouse = get_object_or_404(WarehouseLocation, pk=pk, vendor=vendor)
        
        # Unset others
        WarehouseLocation.objects.filter(vendor=vendor, is_default=True).update(is_default=False)
        
        # Set this
        warehouse.is_default = True
        warehouse.save()

        return Response(WarehouseLocationSerializer(warehouse).data, status=status.HTTP_200_OK)


class SellerStockListAPIView(APIView):
    """
    Lists inventory stock levels for the seller.
    Supports filtering by specific warehouse, low-stock status, and SKU search.
    """
    permission_classes = [IsAuthenticated, IsVendorStaffWithFacilityAccess]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        qs = WarehouseStock.objects.filter(
            warehouse__vendor=vendor
        ).select_related("warehouse", "variant__product")

        staff = request.user.vendor_staff_roles.filter(is_active=True).first()
        if staff and staff.assigned_facility_id:
            qs = qs.filter(warehouse_id=staff.assigned_facility_id)

        wh_id = request.query_params.get("warehouse_id")
        if wh_id:
            qs = qs.filter(warehouse_id=wh_id)

        sku = request.query_params.get("sku")
        if sku:
            qs = qs.filter(variant__sku__icontains=sku)

        # Low stock filter
        if request.query_params.get("low_stock") == "true":
            # Filter where quantity_available <= low_stock_threshold
            qs = [s for s in qs if s.quantity_available <= s.low_stock_threshold]
            serializer = WarehouseStockSerializer(qs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = WarehouseStockSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SellerStockAdjustAPIView(APIView):
    """Manually adjusts inventory levels and records an immutable StockMovement entry."""
    permission_classes = [IsAuthenticated, IsVendorStaffWithFacilityAccess]

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        warehouse = get_object_or_404(WarehouseLocation, id=data["warehouse_id"], vendor=vendor)
        variant = get_object_or_404(ProductVariant, id=data["variant_id"], product__vendor=vendor)

        try:
            stock = InventoryService.adjust_stock(
                warehouse=warehouse,
                variant=variant,
                quantity_delta=data["quantity_delta"],
                movement_type=data["movement_type"],
                performed_by=request.user,
                notes=data.get("notes", ""),
            )
            return Response(WarehouseStockSerializer(stock).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SellerStockTransferAPIView(APIView):
    """Transfers stock between two warehouses belonging to the seller."""
    permission_classes = [IsAuthenticated, IsVendorStaffWithFacilityAccess]

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StockTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        source_wh = get_object_or_404(WarehouseLocation, id=data["source_warehouse_id"], vendor=vendor)
        target_wh = get_object_or_404(WarehouseLocation, id=data["target_warehouse_id"], vendor=vendor)
        variant = get_object_or_404(ProductVariant, id=data["variant_id"], product__vendor=vendor)

        try:
            InventoryService.transfer_stock(
                source_warehouse=source_wh,
                target_warehouse=target_wh,
                variant=variant,
                quantity=data["quantity"],
                performed_by=request.user,
                notes=data.get("notes", ""),
            )
            return Response({"message": f"Successfully transferred {data['quantity']} units."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SellerStockMovementsAPIView(APIView):
    """Returns the immutable double-entry stock movement ledger entries for the seller."""
    permission_classes = [IsAuthenticated, IsVendorStaffWithFacilityAccess]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        qs = StockMovement.objects.filter(warehouse__vendor=vendor)
        
        wh_id = request.query_params.get("warehouse_id")
        if wh_id:
            qs = qs.filter(warehouse_id=wh_id)
            
        movements = qs.select_related("warehouse", "variant", "performed_by").order_by("-created_at")[:100]

        serializer = StockMovementSerializer(movements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
