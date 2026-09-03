"""
apps/common/utils.py
====================
Helper utilities for phone formatting, OTP generation, and token helpers.
"""

import re
import secrets
import string
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

signer = TimestampSigner()


def normalize_ethiopian_phone(phone: str) -> str:
    """
    Normalizes any valid Ethiopian phone variation into canonical format: +2519XXXXXXXX or +2517XXXXXXXX.
    """
    if not phone:
        return ""
    cleaned = re.sub(r"[\s\-\(\)]", "", str(phone))
    if cleaned.startswith("+251"):
        return cleaned
    if cleaned.startswith("251"):
        return f"+{cleaned}"
    if cleaned.startswith("0"):
        return f"+251{cleaned[1:]}"
    if len(cleaned) == 9 and cleaned[0] in ("9", "7"):
        return f"+251{cleaned}"
    return cleaned


def generate_numeric_otp(length: int = 6) -> str:
    """Generate cryptographically secure numeric OTP."""
    digits = string.digits
    return "".join(secrets.choice(digits) for _ in range(length))


def generate_signed_token(value: str) -> str:
    """Generate a tamper-proof timestamped signed token."""
    return signer.sign(value)


def verify_signed_token(token: str, max_age_seconds: int = 86400) -> str:
    """
    Verify and unpack a timestamped signed token.
    Raises ValueError if invalid or expired.
    """
    try:
        return signer.unsign(token, max_age=max_age_seconds)
    except SignatureExpired:
        raise ValueError("Token has expired.")
    except BadSignature:
        raise ValueError("Invalid token signature.")


def mask_account_number(account_number: str) -> str:
    """Masks bank account number, keeping only last 4 digits visible."""
    if not account_number or len(account_number) < 4:
        return "****"
    return f"{'*' * (len(account_number) - 4)}{account_number[-4:]}"
