"""
apps/users/models.py
====================
CustomUser model for GechExpress.

Supports 3 primary roles:
- CUSTOMER: Standard buyer on the public storefront.
- SELLER: Merchant managing store, catalog, and orders.
- ADMIN: Staff user, with Super Admin distinction controlled via is_superuser=True.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from apps.common.models import UUIDModel, TimeStampedModel, SoftDeletableModel, BaseModel
from apps.common.validators import validate_ethiopian_phone
from .managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin, UUIDModel, TimeStampedModel, SoftDeletableModel):
    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", _("Customer")
        SELLER = "SELLER", _("Seller")
        ADMIN = "ADMIN", _("Admin")

    email = models.EmailField(
        _("email address"),
        unique=True,
        db_index=True,
        error_messages={
            "unique": _("A user with that email already exists."),
        },
    )
    phone_number = models.CharField(
        _("phone number"),
        max_length=20,
        null=True,
        blank=True,
        validators=[validate_ethiopian_phone],
        help_text=_("Ethiopian phone number in international format (+2519XXXXXXXX)."),
    )
    first_name = models.CharField(_("first name"), max_length=100)
    last_name = models.CharField(_("last name"), max_length=100)
    
    role = models.CharField(
        _("role"),
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True,
    )
    
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_(
            "Designates whether this user should be treated as active. "
            "Unselect this instead of deleting accounts."
        ),
    )
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into this admin site."),
    )
    is_superuser = models.BooleanField(
        _("superuser status"),
        default=False,
        help_text=_("Designates whether the user has all permissions without explicitly assigning them."),
    )
    is_email_verified = models.BooleanField(
        _("email verified"),
        default=False,
        help_text=_("Designates whether the user has verified their email address."),
    )
    avatar = models.ImageField(
        _("avatar"),
        upload_to="avatars/%Y/%m/",
        null=True,
        blank=True,
    )
    google_id = models.CharField(
        _("google ID"),
        max_length=255,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
    )

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["email"]),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self) -> str:
        return self.first_name

    @property
    def is_super_admin(self) -> bool:
        return bool(self.role == self.Role.ADMIN and self.is_superuser)

    @property
    def is_operational_admin(self) -> bool:
        return bool(self.role == self.Role.ADMIN and self.is_staff and not self.is_superuser)

    @property
    def is_seller(self) -> bool:
        return bool(self.role == self.Role.SELLER)

    @property
    def is_customer(self) -> bool:
        return bool(self.role == self.Role.CUSTOMER)

class CustomerAddress(BaseModel):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    subcity = models.CharField(max_length=100)
    woreda = models.CharField(max_length=50, blank=True)
    house_no = models.CharField(max_length=50, blank=True)
    landmark = models.CharField(max_length=200, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.full_name} - {self.city}, {self.subcity}"
