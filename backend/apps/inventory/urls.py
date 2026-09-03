from django.urls import path
from apps.inventory.views import (
    SellerWarehouseListCreateAPIView,
    SellerWarehouseDetailAPIView,
    SellerWarehouseSetPrimaryAPIView,
    SellerStockListAPIView,
    SellerStockAdjustAPIView,
    SellerStockTransferAPIView,
    SellerStockMovementsAPIView,
)

app_name = "inventory"

urlpatterns = [
    # Warehouses
    path("warehouses/", SellerWarehouseListCreateAPIView.as_view(), name="warehouse-list-create"),
    path("warehouses/<uuid:pk>/", SellerWarehouseDetailAPIView.as_view(), name="warehouse-detail"),
    path("warehouses/<uuid:pk>/set-primary/", SellerWarehouseSetPrimaryAPIView.as_view(), name="warehouse-set-primary"),

    # Stock & Adjustments
    path("stock/", SellerStockListAPIView.as_view(), name="stock-list"),
    path("stock/adjust/", SellerStockAdjustAPIView.as_view(), name="stock-adjust"),
    path("stock/transfer/", SellerStockTransferAPIView.as_view(), name="stock-transfer"),
    path("stock/movements/", SellerStockMovementsAPIView.as_view(), name="stock-movements"),

    # Staff Delegation
    # Moved to apps/vendors/urls.py
]
