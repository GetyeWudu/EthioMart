"""
GechExpress — Root URL Configuration
Phase 1: Auth/Users, Core Settings, Audit Logs.
Phase 2: Vendors & Merchant KYC.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


def api_root_view(request):
    return JsonResponse(
        {
            "success": True,
            "platform": "GechExpress Marketplace API",
            "version": "v1",
            "status": "online",
            "documentation": {
                "swagger": "/api/docs/",
                "redoc": "/api/redoc/",
                "openapi_schema": "/api/schema/",
            },
            "endpoints": {
                "auth":          "/api/v1/auth/",
                "settings":      "/api/v1/settings/",
                "audit_logs":    "/api/v1/audit-logs/",
                "vendors":       "/api/v1/vendors/",
                "admin_vendors": "/api/v1/admin/vendors/",
                "django_admin":  "/django-admin/",
            },
        }
    )


urlpatterns = [
    # API root / health check
    path("", api_root_view, name="root"),
    path("api/v1/", api_root_view, name="api-v1-root"),

    # Django admin technical fallback
    path("django-admin/", admin.site.urls),

    # Phase 1 APIs
    path("api/v1/auth/", include("apps.users.urls", namespace="auth")),
    path("api/v1/settings/", include("apps.core_settings.urls", namespace="core_settings")),
    path("api/v1/audit-logs/", include("apps.audit_logs.urls", namespace="audit_logs")),

    # Phase 2: Vendors & Merchant KYC
    path("api/v1/vendors/", include("apps.vendors.urls")),
    path("api/v1/admin/vendors/", include("apps.vendors.admin_urls")),
    path("api/v1/admin/payments/", include("apps.payments.admin_urls")),
    path("api/v1/admin/", include("apps.orders.admin_urls")),
    path("api/v1/admin/customers/", include([
        path("", include("apps.users.admin_urls")),
    ])),

    # Phase 3: Catalog & Multi-Warehouse Inventory
    path("api/v1/catalog/", include("apps.catalog.urls", namespace="catalog")),
    path("api/v1/inventory/", include("apps.inventory.urls", namespace="inventory")),
    
    # Phase 4: Carts & Orders
    path("api/v1/", include("apps.carts.urls")),
    path("api/v1/", include("apps.orders.urls")),

    # Notifications & Disputes
    path("api/v1/notifications/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.disputes.urls")),
    path("api/v1/", include("apps.promotions.urls")),
    path("api/v1/", include("apps.reviews.urls")),
    path("api/v1/", include("apps.wishlists.urls")),
    path("api/v1/shipping/", include("apps.shipping.urls")),
    path("api/v1/payments/", include("apps.payments.urls")),



    # OpenAPI / Swagger docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
