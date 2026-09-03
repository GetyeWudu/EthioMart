"""
apps/common/exceptions.py
=========================
Custom DRF exception handler providing standardized error responses.

Format:
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR | NOT_AUTHENTICATED | PERMISSION_DENIED | NOT_FOUND | SERVER_ERROR",
        "message": "Human-readable summary",
        "details": { ... }
    }
}
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import (
    APIException,
    ValidationError as DRFValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    Throttled,
)

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Transform all API exceptions into a clean, uniform JSON structure.
    """
    # Handle Django core validation errors mapped to DRF format
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, "message_dict"):
            exc = DRFValidationError(detail=exc.message_dict)
        elif hasattr(exc, "messages"):
            exc = DRFValidationError(detail=exc.messages)
        else:
            exc = DRFValidationError(detail=str(exc))

    response = exception_handler(exc, context)

    if response is not None:
        error_code = "API_ERROR"
        message = "An error occurred."

        if isinstance(exc, (DRFValidationError, DjangoValidationError)):
            error_code = "VALIDATION_ERROR"
            message = "Validation failed for one or more fields."
        elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
            error_code = "UNAUTHORIZED"
            message = "Authentication credentials were not provided or are invalid."
        elif isinstance(exc, PermissionDenied):
            error_code = "FORBIDDEN"
            message = "You do not have permission to perform this action."
        elif isinstance(exc, NotFound):
            error_code = "NOT_FOUND"
            message = "The requested resource was not found."
        elif isinstance(exc, MethodNotAllowed):
            error_code = "METHOD_NOT_ALLOWED"
            message = f"Method {context['request'].method} not allowed."
        elif isinstance(exc, Throttled):
            error_code = "RATE_LIMITED"
            message = f"Request was throttled. Expected available in {exc.wait} seconds."

        response.data = {
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "details": response.data,
            },
        }
    else:
        # Unhandled 500 exceptions
        logger.error(f"Unhandled exception in API view: {str(exc)}", exc_info=True)
        response = Response(
            {
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred on the server.",
                    "details": None,
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
