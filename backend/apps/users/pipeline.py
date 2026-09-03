"""
apps/users/pipeline.py
======================
Custom Social Auth pipeline step for Google OAuth.
"""

from .models import CustomUser


def create_or_link_social_user(backend, user, response, *args, **kwargs):
    """
    Hook for django-social-auth to ensure Google accounts link cleanly to CustomUser.
    """
    if backend.name == "google-oauth2":
        email = response.get("email", "").lower().strip()
        google_id = response.get("sub") or response.get("id")

        if user:
            if not user.google_id and google_id:
                user.google_id = google_id
                user.save(update_fields=["google_id"])
            return {"user": user}

        existing_user = CustomUser.objects.filter(email=email).first()
        if existing_user:
            existing_user.google_id = google_id
            existing_user.save(update_fields=["google_id"])
            return {"user": existing_user}

    return None
