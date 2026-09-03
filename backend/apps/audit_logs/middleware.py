"""
apps/audit_logs/middleware.py
=============================
Django middleware that transparently logs mutating administrative requests.
"""

import json
import logging
from .models import AuditLog

logger = logging.getLogger(__name__)


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        try:
            # We log mutating administrative requests (POST, PUT, PATCH, DELETE under admin paths)
            user = getattr(request, "user", None)
            is_staff = user and user.is_authenticated and (user.is_staff or user.is_superuser)
            is_admin_path = request.path.startswith("/api/v1/auth/admin/") or request.path.startswith("/api/v1/settings/") or "/admin/" in request.path
            is_mutation = request.method in ("POST", "PUT", "PATCH", "DELETE")

            if is_staff and (is_admin_path or is_mutation):
                x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
                if x_forwarded_for:
                    ip = x_forwarded_for.split(",")[0].strip()
                else:
                    ip = request.META.get("REMOTE_ADDR")

                AuditLog.objects.create(
                    actor=user,
                    actor_email=user.email,
                    actor_role="SUPER_ADMIN" if user.is_superuser else ("ADMIN" if user.is_staff else str(getattr(user, "role", ""))),
                    action=AuditLog.ActionType.GENERIC_ACTION,
                    target_type="API_ENDPOINT",
                    target_id="",
                    target_repr=f"{request.method} {request.path}",
                    ip_address=ip,
                    user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                    http_method=request.method,
                    request_path=request.path,
                    response_status=response.status_code,
                    payload={"status_code": response.status_code},
                )
        except Exception as e:
            # Non-blocking — audit log failure should never crash user request
            logger.error(f"AuditLogMiddleware failed to log request: {e}")

        return response
