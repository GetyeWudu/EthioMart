"""
apps/audit_logs/serializers.py
==============================
"""

from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "actor_email",
            "actor_role",
            "action",
            "target_type",
            "target_id",
            "target_repr",
            "payload",
            "ip_address",
            "user_agent",
            "http_method",
            "request_path",
            "response_status",
            "created_at",
        ]
        read_only_fields = fields
