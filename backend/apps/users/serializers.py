"""
apps/users/serializers.py
=========================
Serializers for Customer registration, Seller registration, staff creation, and profiles.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.common.validators import validate_ethiopian_phone
from .models import CustomUser, CustomerAddress


class CustomerRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        validators=[validate_ethiopian_phone],
    )
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    newsletter = serializers.BooleanField(default=False, required=False)

    def validate_email(self, value):
        norm = value.strip().lower()
        if CustomUser.objects.filter(email=norm).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return norm

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs


class SellerRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(
        max_length=20,
        required=True,
        validators=[validate_ethiopian_phone],
    )
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    allowed_category_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
    )

    def validate_email(self, value):
        norm = value.strip().lower()
        if CustomUser.objects.filter(email=norm).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return norm

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class StaffCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        validators=[validate_ethiopian_phone],
    )
    is_superuser = serializers.BooleanField(
        default=False,
        help_text="True for Super Admin, False for Operational Admin."
    )

    def validate_email(self, value):
        norm = value.strip().lower()
        if CustomUser.objects.filter(email=norm).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return norm


class UserDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField(source="get_full_name")
    vendor_staff_role = serializers.SerializerMethodField()
    assigned_facility_id = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
            "avatar",
            "created_at",
            "updated_at",
            "vendor_staff_role",
            "assigned_facility_id",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_email_verified",
            "created_at",
            "updated_at",
            "vendor_staff_role",
            "assigned_facility_id",
        ]

    def get_vendor_staff_role(self, obj) -> str | None:
        staff_record = obj.vendor_staff_roles.filter(is_active=True).first()
        if staff_record:
            return staff_record.role
        return None

    def get_assigned_facility_id(self, obj) -> str | None:
        staff_record = obj.vendor_staff_roles.filter(is_active=True).first()
        if staff_record and staff_record.assigned_facility_id:
            return str(staff_record.assigned_facility_id)
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("first_name", "last_name", "phone_number", "avatar")

    def validate_phone_number(self, value):
        if value:
            validate_ethiopian_phone(value)
        return value

class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = ['id', 'full_name', 'phone_number', 'city', 'subcity', 'woreda', 'house_no', 'landmark', 'is_default']



class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            validate_password(attrs["new_password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True)
    role = serializers.ChoiceField(
        choices=[CustomUser.Role.CUSTOMER, CustomUser.Role.SELLER],
        default=CustomUser.Role.CUSTOMER,
        required=False,
    )


class AdminCustomerListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField(source="get_full_name")
    total_orders = serializers.IntegerField(read_only=True, default=0)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, default=0.00)
    disputes_count = serializers.IntegerField(read_only=True, default=0)
    last_order_date = serializers.DateTimeField(read_only=True, default=None)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "role",
            "is_active",
            "is_email_verified",
            "avatar",
            "google_id",
            "created_at",
            "total_orders",
            "total_spent",
            "disputes_count",
            "last_order_date",
        ]
        read_only_fields = fields


class AdminCustomerDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField(source="get_full_name")
    addresses = CustomerAddressSerializer(many=True, read_only=True)
    orders = serializers.SerializerMethodField()
    disputes = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    disputes_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "role",
            "is_active",
            "is_email_verified",
            "avatar",
            "google_id",
            "created_at",
            "updated_at",
            "total_orders",
            "total_spent",
            "disputes_count",
            "addresses",
            "orders",
            "disputes",
        ]
        read_only_fields = fields

    def get_orders(self, obj):
        from apps.orders.models import Order
        orders = Order.objects.filter(customer=obj).order_by("-created_at")[:10]
        return [
            {
                "id": str(o.id),
                "order_number": o.order_number,
                "total_amount": str(o.total_amount),
                "payment_status": o.payment_status,
                "delivery_method": o.delivery_method,
                "created_at": o.created_at.isoformat(),
                "items_count": sum(so.items.count() for so in o.sub_orders.all()) if hasattr(o, 'sub_orders') else 0,
            }
            for o in orders
        ]

    def get_disputes(self, obj):
        from apps.disputes.models import Dispute
        disputes = Dispute.objects.filter(customer=obj).order_by("-created_at")[:10]
        return [
            {
                "id": str(d.id),
                "reason": d.reason,
                "reason_display": d.get_reason_display(),
                "status": d.status,
                "status_display": d.get_status_display(),
                "disputed_amount": str(d.disputed_amount),
                "refund_amount": str(d.refund_amount),
                "created_at": d.created_at.isoformat(),
            }
            for d in disputes
        ]

    def get_total_orders(self, obj):
        from apps.orders.models import Order
        return Order.objects.filter(customer=obj).count()

    def get_total_spent(self, obj):
        from apps.orders.models import Order
        from django.db.models import Sum
        val = Order.objects.filter(customer=obj, payment_status="PAID").aggregate(s=Sum("total_amount"))["s"] or 0
        return str(val)

    def get_disputes_count(self, obj):
        from apps.disputes.models import Dispute
        return Dispute.objects.filter(customer=obj).count()

