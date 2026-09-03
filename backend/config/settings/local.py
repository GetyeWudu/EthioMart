"""
GechExpress — Local Development Settings
"""

import os
from urllib.parse import urlparse
from .base import *  # noqa
from decouple import config

DEBUG = True

# ---------------------------------------------------------------------------
# Database (PostgreSQL - Docker & Local host compatible)
# ---------------------------------------------------------------------------
database_url = os.environ.get("DATABASE_URL")
if database_url:
    parsed = urlparse(database_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path.lstrip("/") or os.environ.get("POSTGRES_DB") or config("POSTGRES_DB", default="GechMarketPlace"),
            "USER": parsed.username or os.environ.get("POSTGRES_USER") or config("POSTGRES_USER", default="postgres"),
            "PASSWORD": parsed.password or os.environ.get("POSTGRES_PASSWORD") or config("POSTGRES_PASSWORD", default="Gech@1234"),
            "HOST": parsed.hostname or os.environ.get("POSTGRES_HOST") or config("POSTGRES_HOST", default="127.0.0.1"),
            "PORT": str(parsed.port or os.environ.get("POSTGRES_PORT") or config("POSTGRES_PORT", default="5432")),
            "CONN_MAX_AGE": 60,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB") or config("POSTGRES_DB", default="GechMarketPlace"),
            "USER": os.environ.get("POSTGRES_USER") or config("POSTGRES_USER", default="postgres"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD") or config("POSTGRES_PASSWORD", default="Gech@1234"),
            "HOST": os.environ.get("POSTGRES_HOST") or config("POSTGRES_HOST", default="127.0.0.1"),
            "PORT": str(os.environ.get("POSTGRES_PORT") or config("POSTGRES_PORT", default="5432")),
            "CONN_MAX_AGE": 60,
        }
    }

# ---------------------------------------------------------------------------
# Cache & Redis
# ---------------------------------------------------------------------------
use_redis_env = os.environ.get("USE_REDIS")
if use_redis_env is not None:
    USE_REDIS = use_redis_env.lower() in ("true", "1", "yes")
else:
    USE_REDIS = config("USE_REDIS", default=False, cast=bool)

REDIS_URL = os.environ.get("REDIS_URL") or config("REDIS_URL", default="redis://127.0.0.1:6379/0")

if USE_REDIS:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,
            },
            "KEY_PREFIX": "gechexpress",
        }
    }
    CELERY_BROKER_URL = REDIS_URL
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "gechexpress-dev-locmem",
        }
    }

# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# ---------------------------------------------------------------------------
# Email (console for dev)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")

# ---------------------------------------------------------------------------
# CORS & Allowed Hosts (Relaxed for Local / Docker Dev)
# ---------------------------------------------------------------------------
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# ---------------------------------------------------------------------------
# Logging (Console)
# ---------------------------------------------------------------------------
LOGGING["handlers"]["console"]["level"] = "DEBUG"
