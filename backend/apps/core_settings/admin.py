from django.contrib import admin
from .models import PlatformSetting


@admin.register(PlatformSetting)
class PlatformSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "value", "value_type", "is_public", "updated_by", "updated_at")
    list_filter = ("value_type", "is_public")
    search_fields = ("key", "description")
    readonly_fields = ("created_at", "updated_at")
