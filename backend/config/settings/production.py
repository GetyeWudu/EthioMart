"""
GechExpress — Production Settings (Optimized for Render & Cloud Deployment)
"""

from .base import *  # noqa
from decouple import config
import dj_database_url
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

DEBUG = config("DEBUG", default=False, cast=bool)

# ---------------------------------------------------------------------------
# Allowed Hosts & Reverse Proxy Configuration
# ---------------------------------------------------------------------------
ALLOWED_HOSTS = [
    h.strip()
    for h in config(
        "ALLOWED_HOSTS",
        default=config("DJANGO_ALLOWED_HOSTS", default=".onrender.com,localhost,127.0.0.1"),
    ).split(",")
    if h.strip()
]

# Render automatically provides RENDER_EXTERNAL_HOSTNAME (e.g., gechexpress-api.onrender.com)
RENDER_EXTERNAL_HOSTNAME = config("RENDER_EXTERNAL_HOSTNAME", default="")
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Reverse proxy SSL header (Critical for Render/Heroku to prevent redirect loops)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

# ---------------------------------------------------------------------------
# CORS & CSRF Trusted Origins (Vercel Frontend Integration)
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    o.strip().rstrip("/")
    for o in config(
        "CORS_ALLOWED_ORIGINS",
        default=config("FRONTEND_URL", default="http://localhost:3000,http://127.0.0.1:3000"),
    ).split(",")
    if o.strip()
]

# Automatically allow Vercel production and preview deployment URLs
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

CSRF_TRUSTED_ORIGINS = [
    o.strip().rstrip("/")
    for o in config(
        "CSRF_TRUSTED_ORIGINS",
        default=config("FRONTEND_URL", default="http://localhost:3000,http://127.0.0.1:3000"),
    ).split(",")
    if o.strip()
]

if RENDER_EXTERNAL_HOSTNAME:
    render_url = f"https://{RENDER_EXTERNAL_HOSTNAME}".rstrip("/")
    if render_url not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(render_url)

# ---------------------------------------------------------------------------
# Cross-Site Cookie Settings (JWT Auth across Vercel and Render domains)
# ---------------------------------------------------------------------------
JWT_AUTH_COOKIE_SECURE = True
# "None" is required so the browser sends cookies between Vercel and Render
JWT_AUTH_COOKIE_SAMESITE = config("JWT_AUTH_COOKIE_SAMESITE", default="None")

# ---------------------------------------------------------------------------
# Database (Render PostgreSQL via DATABASE_URL or POSTGRES_*)
# ---------------------------------------------------------------------------
DATABASE_URL = config("DATABASE_URL", default="")
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("POSTGRES_DB", default="gechexpress"),
            "USER": config("POSTGRES_USER", default="gechexpress"),
            "PASSWORD": config("POSTGRES_PASSWORD", default=""),
            "HOST": config("POSTGRES_HOST", default="localhost"),
            "PORT": config("POSTGRES_PORT", default="5432"),
            "CONN_MAX_AGE": 600,
            "OPTIONS": {
                "connect_timeout": 10,
                "sslmode": "require",
            },
        }
    }

# ---------------------------------------------------------------------------
# Cache (Redis with graceful fallback to LocMemCache)
# ---------------------------------------------------------------------------
REDIS_URL = config("REDIS_URL", default="")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "CONNECTION_POOL_KWARGS": {"max_connections": 50},
            },
            "KEY_PREFIX": "gechexpress_prod",
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "gechexpress_prod_fallback",
        }
    }

# ---------------------------------------------------------------------------
# Static Files (WhiteNoise for Admin / API UI on Render)
# ---------------------------------------------------------------------------
MIDDLEWARE = list(MIDDLEWARE)
if "whitenoise.middleware.WhiteNoiseMiddleware" not in MIDDLEWARE:
    try:
        sec_idx = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware")
        MIDDLEWARE.insert(sec_idx + 1, "whitenoise.middleware.WhiteNoiseMiddleware")
    except ValueError:
        MIDDLEWARE.insert(0, "whitenoise.middleware.WhiteNoiseMiddleware")

STORAGES["staticfiles"] = {
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
}

# ---------------------------------------------------------------------------
# Media Storage (Cloudinary by default, S3 if AWS credentials provided)
# ---------------------------------------------------------------------------
if config("AWS_ACCESS_KEY_ID", default=""):
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    }
    AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="us-east-1")
    AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
    AWS_DEFAULT_ACL = "private"
    AWS_S3_FILE_OVERWRITE = False
elif config("CLOUDINARY_CLOUD_NAME", default=""):
    STORAGES["default"] = {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    }

# ---------------------------------------------------------------------------
# Email (Production SMTP)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = True

# ---------------------------------------------------------------------------
# Sentry Error Tracking
# ---------------------------------------------------------------------------
SENTRY_DSN = config("SENTRY_DSN", default="")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.2,
        send_default_pii=False,
    )
