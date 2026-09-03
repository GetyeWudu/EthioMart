"""
apps/core_settings/urls.py
==========================
"""

from django.urls import path
from .views import PublicSettingsListView, AdminSettingsListView, AdminSettingDetailView

app_name = "core_settings"

urlpatterns = [
    path("public/", PublicSettingsListView.as_view(), name="public-settings"),
    path("", AdminSettingsListView.as_view(), name="admin-settings-list"),
    path("<str:key>/", AdminSettingDetailView.as_view(), name="admin-setting-detail"),
]
