"""
apps/core_settings/views.py
===========================
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from apps.common.permissions import IsSuperAdmin
from .models import PlatformSetting
from .serializers import PlatformSettingSerializer, PlatformSettingUpdateSerializer
from .services import SettingsService


class PublicSettingsListView(APIView):
    """
    GET /api/v1/settings/public/
    Publicly accessible platform configurations (store name, maintenance mode, etc).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        data = SettingsService.get_all_public()
        return Response({"success": True, "settings": data})


class AdminSettingsListView(APIView):
    """
    GET /api/v1/settings/
    List all platform settings (Super Admin only).
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        settings_qs = PlatformSetting.objects.all().order_by("key")
        serializer = PlatformSettingSerializer(settings_qs, many=True)
        return Response({"success": True, "results": serializer.data})


class AdminSettingDetailView(APIView):
    """
    GET /api/v1/settings/<key>/
    PATCH /api/v1/settings/<key>/
    Manage single platform setting (Super Admin only).
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request, key):
        try:
            setting = PlatformSetting.objects.get(key=key)
            serializer = PlatformSettingSerializer(setting)
            return Response({"success": True, "data": serializer.data})
        except PlatformSetting.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "NOT_FOUND", "message": f"Setting '{key}' not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request, key):
        serializer = PlatformSettingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            existing = PlatformSetting.objects.get(key=key)
            val = serializer.validated_data["value"]
            desc = serializer.validated_data.get("description", existing.description)
            is_pub = serializer.validated_data.get("is_public", existing.is_public)

            updated = SettingsService.set(
                key=key,
                value=val,
                actor=request.user,
                description=desc,
                is_public=is_pub,
                value_type=existing.value_type,
            )
            out_serializer = PlatformSettingSerializer(updated)
            return Response({"success": True, "data": out_serializer.data})
        except PlatformSetting.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "NOT_FOUND", "message": f"Setting '{key}' not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
