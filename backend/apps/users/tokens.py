"""
apps/users/tokens.py
====================
Custom JWT Token serializer enriching payload with role, staff, and superuser claims.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom claims embedded into JWT access token
        token["user_id"] = str(user.id)
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["role"] = user.role
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser
        token["is_email_verified"] = user.is_email_verified
        token["is_active"] = user.is_active

        return token
