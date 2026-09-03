"""
apps/common/validators.py
=========================
Reusable validators for Ethiopian market specifics:
  - Phone numbers in +251 format
  - Ethiopian TIN format
  - File type / size constraints
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_ethiopian_phone(value: str) -> None:
    """
    Validates Ethiopian mobile phone numbers.

    Accepted formats:
      - +251912345678   (international, 12 digits after +)
      - 0912345678      (local 10-digit format)
      - 912345678       (9-digit without leading 0 or +251)

    Ethiopian operators: 9xx (Ethio Telecom), 7xx (Safaricom ET)
    """
    cleaned = re.sub(r"[\s\-\(\)]", "", str(value))

    # Normalize to international format
    if cleaned.startswith("+251"):
        local_part = cleaned[4:]
    elif cleaned.startswith("251"):
        local_part = cleaned[3:]
    elif cleaned.startswith("0"):
        local_part = cleaned[1:]
    else:
        local_part = cleaned

    # Ethiopian mobile numbers: 9 digits, starting with 9 or 7
    if not re.match(r"^[97]\d{8}$", local_part):
        raise ValidationError(
            _("Enter a valid Ethiopian phone number (e.g. +251912345678 or 0912345678).")
        )


def validate_tin_number(value: str) -> None:
    """
    Validates Ethiopian TIN (Tax Identification Number).
    Ethiopian TIN is 10 digits.
    """
    cleaned = re.sub(r"[\s\-]", "", str(value))
    if not re.match(r"^\d{10}$", cleaned):
        raise ValidationError(
            _("TIN must be a 10-digit number.")
        )


def validate_image_file(value) -> None:
    """
    Validates that uploaded file is an allowed image type and under size limit.
    """
    import os
    ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
    MAX_SIZE_MB = 10

    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            _(f"Unsupported image format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}.")
        )
    if value.size > MAX_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            _(f"Image size cannot exceed {MAX_SIZE_MB}MB.")
        )


def validate_document_file(value) -> None:
    """
    Validates KYC document uploads (TIN, Trade License, Fayda ID).
    Accepts PDF and images.
    """
    import os
    ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]
    MAX_SIZE_MB = 5

    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            _(f"Unsupported document format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}.")
        )
    if value.size > MAX_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            _(f"Document size cannot exceed {MAX_SIZE_MB}MB.")
        )
