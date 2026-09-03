"""
apps/users/authentication.py
============================
Custom JWT Authentication class for GechExpress.

Allows suspended accounts (is_active=False) to authenticate in RESTRICTED / READ-ONLY mode,
populating request.user so they can view past orders, tracking, and account notices.
Blocks soft-deleted accounts (deleted_at is not None).
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings


class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        Preserves suspended users in read-only restricted mode rather than throwing 401.
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken("Token contained no recognizable user identification")

        try:
            user = self.user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except self.user_model.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")

        # Block soft-deleted users
        if getattr(user, "deleted_at", None) is not None:
            raise AuthenticationFailed("User account has been deleted", code="user_deleted")

        return user
