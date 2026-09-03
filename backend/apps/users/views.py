"""
apps/users/views.py
===================
API Views for User Authentication, Profiles, and Staff Provisioning.
"""

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.permissions import IsSuperAdmin
from .serializers import (
    CustomerRegisterSerializer,
    SellerRegisterSerializer,
    LoginSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
    StaffCreateSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
    GoogleAuthSerializer,
    CustomerAddressSerializer,
)
from .models import CustomUser, CustomerAddress
from .services import AuthService, GoogleOAuthService
from .tokens import CustomTokenObtainPairSerializer


def _set_jwt_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """
    Helper setting httpOnly secure cookies for Next.js web application.
    """
    cookie_secure = getattr(settings, "JWT_AUTH_COOKIE_SECURE", False)
    samesite = getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax")

    response.set_cookie(
        key=getattr(settings, "JWT_AUTH_COOKIE", "gechexpress_access"),
        value=access_token,
        httponly=True,
        secure=cookie_secure,
        samesite=samesite,
        max_age=60 * 60 * 24,  # 1 day
    )
    response.set_cookie(
        key=getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "gechexpress_refresh"),
        value=refresh_token,
        httponly=True,
        secure=cookie_secure,
        samesite=samesite,
        max_age=60 * 60 * 24 * 30,  # 30 days
    )


class CustomerRegisterView(APIView):
    """
    POST /api/v1/auth/register/customer/
    Public customer registration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register_customer(serializer.validated_data)

        # Generate tokens
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access = str(refresh.access_token)
        refresh_str = str(refresh)

        user_data = UserDetailSerializer(user).data
        response = Response(
            {
                "success": True,
                "message": "Customer account created successfully.",
                "user": user_data,
                "access": access,
                "refresh": refresh_str,
            },
            status=status.HTTP_201_CREATED,
        )
        _set_jwt_cookies(response, access, refresh_str)
        return response


class SellerRegisterView(APIView):
    """
    POST /api/v1/auth/register/seller/
    Public seller registration (requires phone and KYC next).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SellerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register_seller(serializer.validated_data)

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access = str(refresh.access_token)
        refresh_str = str(refresh)

        user_data = UserDetailSerializer(user).data
        response = Response(
            {
                "success": True,
                "message": "Seller account registered. Please complete your KYC documentation.",
                "user": user_data,
                "access": access,
                "refresh": refresh_str,
            },
            status=status.HTTP_201_CREATED,
        )
        _set_jwt_cookies(response, access, refresh_str)
        return response


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Unified email + password login for Customers, Sellers, and Admins.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, access, refresh = AuthService.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            request=request,
        )

        user_data = UserDetailSerializer(user).data
        response = Response(
            {
                "success": True,
                "message": f"Welcome back, {user.first_name}!",
                "user": user_data,
                "access": access,
                "refresh": refresh,
            },
            status=status.HTTP_200_OK,
        )
        _set_jwt_cookies(response, access, refresh)
        return response


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists refresh token and clears auth cookies.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh") or request.COOKIES.get(getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "gechexpress_refresh"))
        if refresh_token:
            AuthService.logout(refresh_token)

        response = Response({"success": True, "message": "Logged out successfully."})
        response.delete_cookie(getattr(settings, "JWT_AUTH_COOKIE", "gechexpress_access"))
        response.delete_cookie(getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "gechexpress_refresh"))
        return response


class GoogleAuthView(APIView):
    """
    POST /api/v1/auth/google/
    Exchanges a Google ID Token for JWT authentication.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, created = GoogleOAuthService.authenticate_google_token(
            id_token=serializer.validated_data["id_token"],
            requested_role=serializer.validated_data.get("role", "CUSTOMER"),
        )

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access = str(refresh.access_token)
        refresh_str = str(refresh)

        user_data = UserDetailSerializer(user).data
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        response = Response(
            {
                "success": True,
                "message": "Authenticated with Google.",
                "user": user_data,
                "access": access,
                "refresh": refresh_str,
            },
            status=status_code,
        )
        _set_jwt_cookies(response, access, refresh_str)
        return response


class EmailVerificationView(APIView):
    """
    POST /api/v1/auth/verify-email/
    Confirms email address using signed token.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.verify_email(serializer.validated_data["token"])
        return Response({"success": True, "message": "Email verified successfully.", "user_id": str(user.id)})


class PasswordResetRequestView(APIView):
    """
    POST /api/v1/auth/password/reset/request/
    Initiates password reset flow.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.request_password_reset(serializer.validated_data["email"])
        return Response({
            "success": True,
            "message": "If an account with that email exists, a password reset link has been sent."
        })


class PasswordResetConfirmView(APIView):
    """
    POST /api/v1/auth/password/reset/confirm/
    Completes password reset with new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.confirm_password_reset(
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["new_password"],
        )
        return Response({"success": True, "message": "Password updated successfully. Please sign in."})


class PasswordChangeView(APIView):
    """
    POST /api/v1/auth/password/change/
    Change password for authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not current_password or not new_password:
            return Response({"success": False, "message": "Current and new password are required."}, status=400)

        if not request.user.check_password(current_password):
            return Response({"success": False, "message": "Current password is incorrect."}, status=400)

        if new_password != confirm_password:
            return Response({"success": False, "message": "New passwords do not match."}, status=400)

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(new_password, request.user)
        except ValidationError as e:
            return Response({"success": False, "message": ", ".join(e.messages)}, status=400)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"success": True, "message": "Password updated successfully."})


class CurrentUserView(APIView):
    """
    GET /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    Get and update current authenticated user profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response({"success": True, "user": serializer.data})

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        out_serializer = UserDetailSerializer(request.user)
        return Response({"success": True, "user": out_serializer.data})


class StaffProvisionView(APIView):
    """
    POST /api/v1/auth/admin/staff/
    Super Admin only: provisions an Operational Admin or Super Admin.
    """
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        staff_user, temp_password = AuthService.provision_staff(
            actor=request.user,
            validated_data=serializer.validated_data,
        )

        user_data = UserDetailSerializer(staff_user).data
        return Response(
            {
                "success": True,
                "message": "Staff account provisioned successfully.",
                "user": user_data,
                "temporary_password": temp_password,  # Returned so Super Admin can see or copy if needed in console
            },
            status=status.HTTP_201_CREATED,
        )

from rest_framework import generics

class CustomerAddressListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerAddressSerializer

    def get_queryset(self):
        return CustomerAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CustomerAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerAddressSerializer

    def get_queryset(self):
        return CustomerAddress.objects.filter(user=self.request.user)


from django.db.models import Count, Sum, Q, Max, Value, DecimalField
from django.db.models.functions import Coalesce
from apps.common.permissions import IsAnyAdmin
from .serializers import AdminCustomerListSerializer, AdminCustomerDetailSerializer


class AdminCustomerListView(APIView):
    """
    GET /api/v1/auth/admin/customers/
    List all platform customers with search, status filtering, and financial metrics.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        qs = CustomUser.objects.filter(role=CustomUser.Role.CUSTOMER)

        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone_number__icontains=search)
            )

        status_filter = request.query_params.get("status", "ALL").upper()
        if status_filter == "ACTIVE":
            qs = qs.filter(is_active=True)
        elif status_filter in ("INACTIVE", "BANNED"):
            qs = qs.filter(is_active=False)
        elif status_filter == "VERIFIED":
            qs = qs.filter(is_email_verified=True)
        elif status_filter == "UNVERIFIED":
            qs = qs.filter(is_email_verified=False)

        qs = qs.annotate(
            total_orders=Count("orders", distinct=True),
            total_spent=Coalesce(
                Sum("orders__total_amount", filter=Q(orders__payment_status="PAID")),
                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            ),
            disputes_count=Count("filed_disputes", distinct=True),
            last_order_date=Max("orders__created_at"),
        )

        ordering = request.query_params.get("ordering", "-created_at")
        valid_orderings = {
            "-created_at", "created_at",
            "-total_spent", "total_spent",
            "-total_orders", "total_orders",
            "first_name", "-first_name",
            "email", "-email",
        }
        if ordering in valid_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-created_at")

        serializer = AdminCustomerListSerializer(qs, many=True)
        return Response({
            "success": True,
            "count": qs.count(),
            "customers": serializer.data,
        })


class AdminCustomerStatsView(APIView):
    """
    GET /api/v1/auth/admin/customers/stats/
    High level customer KPIs across the entire platform.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        from datetime import timedelta
        from django.utils import timezone
        from apps.orders.models import Order

        total_customers = CustomUser.objects.filter(role=CustomUser.Role.CUSTOMER).count()
        active_customers = CustomUser.objects.filter(role=CustomUser.Role.CUSTOMER, is_active=True).count()
        verified_customers = CustomUser.objects.filter(role=CustomUser.Role.CUSTOMER, is_email_verified=True).count()
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_this_month = CustomUser.objects.filter(role=CustomUser.Role.CUSTOMER, created_at__gte=thirty_days_ago).count()

        total_spent = Order.objects.filter(payment_status="PAID").aggregate(s=Sum("total_amount"))["s"] or 0
        total_orders = Order.objects.count()

        return Response({
            "success": True,
            "stats": {
                "total_customers": total_customers,
                "active_customers": active_customers,
                "verified_customers": verified_customers,
                "inactive_customers": total_customers - active_customers,
                "new_this_month": new_this_month,
                "total_spent_etb": str(total_spent),
                "total_orders_placed": total_orders,
            }
        })


class AdminCustomerDetailView(APIView):
    """
    GET /api/v1/auth/admin/customers/<id>/
    Retrieve complete customer profile including addresses and order history.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request, pk):
        from django.shortcuts import get_object_or_404
        customer = get_object_or_404(CustomUser, id=pk, role=CustomUser.Role.CUSTOMER)
        serializer = AdminCustomerDetailSerializer(customer)
        return Response({
            "success": True,
            "customer": serializer.data,
        })


class AdminCustomerToggleStatusView(APIView):
    """
    POST /api/v1/auth/admin/customers/<id>/toggle-status/
    Activates or suspends a customer account.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, pk):
        from django.shortcuts import get_object_or_404
        customer = get_object_or_404(CustomUser, id=pk, role=CustomUser.Role.CUSTOMER)
        
        target_active = request.data.get("is_active")
        if target_active is not None:
            customer.is_active = bool(target_active)
        else:
            customer.is_active = not customer.is_active
            
        customer.save(update_fields=["is_active", "updated_at"])
        
        status_label = "activated" if customer.is_active else "suspended / banned"
        return Response({
            "success": True,
            "message": f"Customer account has been {status_label}.",
            "is_active": customer.is_active,
        })


class AdminCustomerVerifyEmailView(APIView):
    """
    POST /api/v1/auth/admin/customers/<id>/verify-email/
    Manually marks customer email as verified.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, pk):
        from django.shortcuts import get_object_or_404
        customer = get_object_or_404(CustomUser, id=pk, role=CustomUser.Role.CUSTOMER)
        customer.is_email_verified = True
        customer.save(update_fields=["is_email_verified", "updated_at"])
        return Response({
            "success": True,
            "message": "Customer email marked as verified.",
            "is_email_verified": True,
        })


