#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==> Installing production dependencies..."
pip install -r requirements/production.txt

echo "==> Collecting static files..."
python manage.py collectstatic --no-input

echo "==> Running database migrations..."
python manage.py migrate --no-input

echo "==> Seeding platform settings, shipping, and catalog..."
python manage.py seed_platform_settings
python manage.py seed_shipping_rates
python manage.py seed_catalog_taxonomy
python manage.py seed_demo_catalog
python manage.py seed_mock_store
python manage.py sync_real_product_images

# Automatically create superadmin if credentials are provided in environment
if [ -n "$SUPERUSER_EMAIL" ] && [ -n "$SUPERUSER_PASSWORD" ]; then
    echo "==> Ensuring super admin exists ($SUPERUSER_EMAIL)..."
    python manage.py createsuperadmin --email="$SUPERUSER_EMAIL" --password="$SUPERUSER_PASSWORD" --first-name="Admin" --last-name="User" || true
fi

echo "==> Build complete!"
