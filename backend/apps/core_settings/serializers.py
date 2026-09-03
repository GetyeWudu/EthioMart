"""
apps/core_settings/serializers.py
=================================
"""

from rest_framework import serializers
from .models import PlatformSetting


class PlatformSettingSerializer(serializers.ModelSerializer):
    updated_by_email = serializers.ReadOnlyField(source="updated_by.email")

    class Meta:
        model = PlatformSetting
        fields = [
            "id",
            "key",
            "value",
            "value_type",
            "description",
            "is_public",
            "updated_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "key", "value_type", "created_at", "updated_at"]


class PlatformSettingUpdateSerializer(serializers.Serializer):
    value = serializers.CharField(required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    is_public = serializers.BooleanField(required=False)
