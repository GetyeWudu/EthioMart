from django.db import models
from rest_framework import serializers
from apps.reviews.models import Review, ReviewReply, ReviewHelpfulVote
from apps.orders.models import OrderItem

class ReviewReplySerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.store_name', read_only=True)

    class Meta:
        model = ReviewReply
        fields = ['id', 'seller_name', 'body', 'created_at']
        read_only_fields = ['id', 'seller_name', 'created_at']

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    seller_reply = ReviewReplySerializer(read_only=True)
    product_details = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_details', 'customer_name', 'rating', 'title', 'body',
            'is_verified_purchase', 'helpful_count', 'created_at', 'seller_reply', 'is_approved'
        ]

    def get_customer_name(self, obj):
        if obj.customer.first_name and obj.customer.last_name:
            return f"{obj.customer.first_name[0]}. {obj.customer.last_name}"
        return "Verified Customer"

    def get_product_details(self, obj):
        if not obj.product:
            return None
        first_img = obj.product.images.first()
        return {
            'id': str(obj.product.id),
            'title': obj.product.title,
            'slug': obj.product.slug,
            'image_url': first_img.image_url if first_img else None,
        }

class ReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['product', 'rating', 'title', 'body']
        extra_kwargs = {
            'product': {'required': False}
        }

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        product = attrs.get('product') or (self.instance.product if self.instance else None)

        if not product:
            raise serializers.ValidationError({"product": "Product is required."})

        # Ensure user has a delivered order for this product
        has_purchased = OrderItem.objects.filter(
            vendor_sub_order__order__customer=user,
            variant__product=product,
        ).filter(
            models.Q(status='DELIVERED') | models.Q(vendor_sub_order__delivered_at__isnull=False)
        ).exists()

        if not has_purchased:
            raise serializers.ValidationError("You must have purchased and received this product to review it.")

        # Ensure they haven't already reviewed it (excluding current instance if updating)
        existing_qs = Review.objects.filter(customer=user, product=product)
        if self.instance:
            existing_qs = existing_qs.exclude(id=self.instance.id)

        if existing_qs.exists():
            raise serializers.ValidationError("You have already reviewed this product.")

        return attrs

    def create(self, validated_data):
        user = self.context.get('request').user
        validated_data['customer'] = user
        validated_data['is_verified_purchase'] = True
        return super().create(validated_data)

