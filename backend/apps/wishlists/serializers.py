from rest_framework import serializers
from apps.wishlists.models import WishlistItem
from apps.catalog.serializers import ProductListSerializer

class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'created_at']

class WishlistSyncSerializer(serializers.Serializer):
    product_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False
    )
