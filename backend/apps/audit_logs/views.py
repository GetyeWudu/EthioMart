"""
apps/audit_logs/views.py
========================
"""

from django.db.models import Q
from rest_framework.generics import ListAPIView
from apps.common.permissions import IsAnyAdmin
from apps.common.pagination import StandardResultsSetPagination
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(ListAPIView):
    """
    GET /api/v1/audit-logs/
    List paginated audit logs with filtering by action, actor, or date.
    Accessible by Operational Admins and Super Admins.
    """
    permission_classes = [IsAnyAdmin]
    serializer_class = AuditLogSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = AuditLog.objects.all().order_by("-created_at")
        action = self.request.query_params.get("action")
        actor_email = self.request.query_params.get("actor")
        target_type = self.request.query_params.get("target_type")

        if action:
            qs = qs.filter(action=action)
        if actor_email:
            qs = qs.filter(actor_email__icontains=actor_email)
        if target_type:
            qs = qs.filter(target_type=target_type)

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(actor_email__icontains=q) |
                Q(action__icontains=q) |
                Q(target_repr__icontains=q) |
                Q(ip_address__icontains=q)
            )

        limit = self.request.query_params.get("limit")
        if limit and limit.isdigit():
            qs = qs[:int(limit)]

        return qs
