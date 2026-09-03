"""
GechExpress — Test Settings
Uses SQLite and in-memory cache for fast, isolated test execution.
"""

from .base import *  # noqa

DEBUG = False
SECRET_KEY = "test-secret-key-for-automated-testing-12345"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "gechexpress-test-cache",
    }
}

# Fast password hasher for tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
