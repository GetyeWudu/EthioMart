"""
apps/users/services.py
======================
Domain-Driven Service Layer for Authentication, Staff Provisioning, and OAuth.
Strict Rule: No business logic in views or models.
"""

import logging
import secrets
import string
import requests
from django.contrib.auth import authenticate
from django.db import transaction
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed, ValidationError, PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from apps.common.utils import (
    normalize_ethiopian_phone,
    generate_signed_token,
    verify_signed_token,
)
from apps.audit_logs.models import AuditLog
from apps.vendors.models import VendorProfile
from .models import CustomUser
from .tokens import CustomTokenObtainPairSerializer

logger = logging.getLogger(__name__)


class AuthService:
    @staticmethod
    @transaction.atomic
    def register_customer(validated_data: dict) -> CustomUser:
        """
        Creates a public customer account.
        """
        email = validated_data["email"].strip().lower()
        phone = normalize_ethiopian_phone(validated_data.get("phone_number", ""))
        
        user = CustomUser.objects.create_user(
            email=email,
            password=validated_data["password"],
            first_name=validated_data["first_name"].strip(),
            last_name=validated_data["last_name"].strip(),
            phone_number=phone or None,
            role=CustomUser.Role.CUSTOMER,
            is_active=True,
            is_email_verified=False,
        )

        verification_token = generate_signed_token(f"verify_email:{user.id}")
        logger.info(f"Verification token generated for {user.email}: {verification_token}")

        return user

    @staticmethod
    @transaction.atomic
    def register_seller(validated_data: dict) -> CustomUser:
        """
        Creates a merchant account. Merchant must complete KYC before store activation.
        """
        email = validated_data["email"].strip().lower()
        phone = normalize_ethiopian_phone(validated_data["phone_number"])

        user = CustomUser.objects.create_user(
            email=email,
            password=validated_data["password"],
            first_name=validated_data["first_name"].strip(),
            last_name=validated_data["last_name"].strip(),
            phone_number=phone,
            role=CustomUser.Role.SELLER,
            is_active=True,
            is_email_verified=False,
        )

        # Pre-provision the VendorProfile for the seller to persist category scopes
        base_store_name = f"{user.first_name} {user.last_name}'s Store".strip() or f"Store {user.email.split('@')[0]}"
        store_name = base_store_name
        counter = 1
        while VendorProfile.objects.filter(store_name=store_name).exists():
            store_name = f"{base_store_name} ({counter})"
            counter += 1

        vendor = VendorProfile.objects.create(
            user=user,
            store_name=store_name,
            contact_email=email,
            contact_phone=phone,
        )
        
        # Assign allowed root categories
        allowed_cat_ids = validated_data.get("allowed_category_ids", [])
        if allowed_cat_ids:
            vendor.allowed_categories.set(allowed_cat_ids)

        # Log audit
        AuditLog.objects.create(
            actor=user,
            actor_email=user.email,
            actor_role=user.role,
            action=AuditLog.ActionType.SELLER_REGISTERED,
            target_type="CustomUser",
            target_id=str(user.id),
            target_repr=f"{user.get_full_name()} ({user.email})",
            payload={"role": "SELLER", "phone_number": phone},
        )

        return user

    @classmethod
    def login(cls, email: str, password: str, request=None) -> tuple[CustomUser, str, str]:
        """
        Validates credentials and generates JWT token pair with custom claims.
        Permits suspended accounts to log in under restricted/read-only mode.
        """
        email = email.strip().lower()
        user = CustomUser.objects.filter(email=email).first()

        if not user or not user.check_password(password):
            raise AuthenticationFailed("Invalid email or password.")

        if getattr(user, "deleted_at", None) is not None:
            raise AuthenticationFailed("This account has been deleted.")

        # Generate tokens with claims
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access = refresh.access_token

        # Audit admin login
        if user.role == CustomUser.Role.ADMIN or user.is_staff:
            ip = None
            if request:
                x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
                ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.META.get("REMOTE_ADDR")

            AuditLog.objects.create(
                actor=user,
                actor_email=user.email,
                actor_role="SUPER_ADMIN" if user.is_superuser else "ADMIN",
                action=AuditLog.ActionType.ADMIN_LOGIN,
                target_type="CustomUser",
                target_id=str(user.id),
                target_repr=f"{user.get_full_name()} ({user.email})",
                ip_address=ip,
            )

        return user, str(access), str(refresh)

    @staticmethod
    def logout(refresh_token_str: str) -> None:
        """
        Blacklists the refresh token.
        """
        try:
            token = RefreshToken(refresh_token_str)
            token.blacklist()
        except Exception as e:
            logger.warning(f"Logout token blacklist failed: {e}")

    @staticmethod
    @transaction.atomic
    def verify_email(token: str) -> CustomUser:
        """
        Validates signed token and marks email verified.
        """
        try:
            payload = verify_signed_token(token, max_age_seconds=86400 * 3)  # 3 days
            if not payload.startswith("verify_email:"):
                raise ValidationError("Invalid verification token.")
            user_id = payload.split(":", 1)[1]
            user = CustomUser.objects.get(id=user_id)
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])
            return user
        except (ValueError, CustomUser.DoesNotExist) as e:
            raise ValidationError(f"Email verification failed: {str(e)}")

    @staticmethod
    def request_password_reset(email: str) -> None:
        """
        Generates password reset token if user exists (fail silently to prevent enumeration).
        """
        try:
            user = CustomUser.objects.get(email=email.strip().lower(), is_active=True)
            reset_token = generate_signed_token(f"reset_pw:{user.id}")
            logger.info(f"Password reset token generated for {user.email}: {reset_token}")
        except CustomUser.DoesNotExist:
            logger.info(f"Password reset requested for non-existent email: {email}")

    @staticmethod
    @transaction.atomic
    def confirm_password_reset(token: str, new_password: str) -> CustomUser:
        """
        Validates reset token and sets new password.
        """
        try:
            payload = verify_signed_token(token, max_age_seconds=3600 * 2)  # 2 hours
            if not payload.startswith("reset_pw:"):
                raise ValidationError("Invalid reset token.")
            user_id = payload.split(":", 1)[1]
            user = CustomUser.objects.get(id=user_id)
            user.set_password(new_password)
            user.save(update_fields=["password"])

            AuditLog.objects.create(
                actor=user,
                actor_email=user.email,
                actor_role=user.role,
                action=AuditLog.ActionType.PASSWORD_RESET,
                target_type="CustomUser",
                target_id=str(user.id),
                target_repr=f"{user.get_full_name()} ({user.email})",
            )
            return user
        except (ValueError, CustomUser.DoesNotExist) as e:
            raise ValidationError(f"Password reset failed: {str(e)}")

    @staticmethod
    @transaction.atomic
    def provision_staff(actor: CustomUser, validated_data: dict) -> tuple[CustomUser, str]:
        """
        Super Admin restricted: creates Operational Admin or Super Admin accounts.
        Returns (created_user, temporary_password).
        """
        if not actor.is_superuser:
            raise PermissionDenied("Only Super Admins can provision staff accounts.")

        email = validated_data["email"].strip().lower()
        phone = normalize_ethiopian_phone(validated_data.get("phone_number", ""))
        is_su = validated_data.get("is_superuser", False)

        # Generate secure random temporary password
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        temp_password = "".join(secrets.choice(chars) for _ in range(16))

        staff_user = CustomUser.objects.create_user(
            email=email,
            password=temp_password,
            first_name=validated_data["first_name"].strip(),
            last_name=validated_data["last_name"].strip(),
            phone_number=phone or None,
            role=CustomUser.Role.ADMIN,
            is_staff=True,
            is_superuser=is_su,
            is_email_verified=True,
            is_active=True,
        )

        AuditLog.objects.create(
            actor=actor,
            actor_email=actor.email,
            actor_role="SUPER_ADMIN",
            action=AuditLog.ActionType.STAFF_PROVISIONED,
            target_type="CustomUser",
            target_id=str(staff_user.id),
            target_repr=f"{staff_user.get_full_name()} ({staff_user.email})",
            payload={"is_superuser": is_su, "role": "ADMIN"},
        )

        return staff_user, temp_password


class GoogleOAuthService:
    @staticmethod
    @transaction.atomic
    def authenticate_google_token(id_token: str = None, token: str = None, requested_role: str = "CUSTOMER") -> tuple[CustomUser, bool]:
        """
        Validates Google Token (supports both ID Token and OAuth2 Access Token) server-side
        and links or creates the user.
        Rule: New registration via Google is strictly restricted to CUSTOMER role.
        Existing sellers and admins can log in if their email matches.
        """
        auth_token = id_token or token
        if not auth_token:
            raise ValidationError("No Google token provided.")

        google_data = None

        # 1. Try resolving as OAuth2 Access Token via Google userinfo endpoint
        try:
            res = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {auth_token}"},
                timeout=6,
            )
            if res.status_code == 200:
                google_data = res.json()
        except requests.RequestException:
            pass

        # 2. If not an access token, try resolving as ID Token via tokeninfo endpoint
        if not google_data:
            try:
                res = requests.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": auth_token},
                    timeout=6,
                )
                if res.status_code == 200:
                    google_data = res.json()
            except requests.RequestException:
                pass

        # 3. Fallback: try tokeninfo with access_token query param
        if not google_data:
            try:
                res = requests.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"access_token": auth_token},
                    timeout=6,
                )
                if res.status_code == 200:
                    google_data = res.json()
            except requests.RequestException:
                pass

        if not google_data:
            raise ValidationError("Invalid or expired Google authentication token.")

        google_id = google_data.get("sub") or google_data.get("user_id")
        email = (google_data.get("email") or "").strip().lower()
        first_name = google_data.get("given_name") or google_data.get("name", "Google").split()[0]
        last_name = google_data.get("family_name") or (google_data.get("name", "User").split()[-1] if len(google_data.get("name", "").split()) > 1 else "User")
        email_verified = google_data.get("email_verified", True)

        if not email:
            raise ValidationError("Email not provided by Google account.")

        # 1. Match by google_id
        if google_id:
            user = CustomUser.objects.filter(google_id=google_id).first()
            if user:
                return user, False

        # 2. Match by email (links existing customer, seller, or admin to their Google account)
        user = CustomUser.objects.filter(email=email).first()
        if user:
            if google_id:
                user.google_id = google_id
            if email_verified and not user.is_email_verified:
                user.is_email_verified = True
            user.save(update_fields=["google_id", "is_email_verified"])
            return user, False

        # 3. New user registration via Google — strictly CUSTOMER
        if requested_role == CustomUser.Role.SELLER:
            raise PermissionDenied("Sellers must register via standard email and password with KYC documentation.")

        new_user = CustomUser.objects.create_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=CustomUser.Role.CUSTOMER,
            google_id=google_id,
            is_active=True,
            is_email_verified=bool(email_verified),
        )

        return new_user, True
