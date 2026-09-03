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

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'customer_name', 'rating', 'title', 'body',
            'is_verified_purchase', 'helpful_count', 'created_at', 'seller_reply', 'is_approved'
        ]

    def get_customer_name(self, obj):
        if obj.customer.first_name and obj.customer.last_name:
            return f"{obj.customer.first_name[0]}. {obj.customer.last_name}"
        return "Verified Customer"

class ReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['product', 'rating', 'title', 'body']

    def validate(self, attrs):
        request = self.context.get('request')
        product = attrs.get('product')
        user = request.user

        # Ensure user has a delivered order for this product
        has_purchased = OrderItem.objects.filter(
            vendor_sub_order__order__customer=user,
            variant__product=product,
            status='DELIVERED'
        ).exists()

        if not has_purchased:
            raise serializers.ValidationError("You must have purchased and received this product to review it.")

        # Ensure they haven't already reviewed it
        if Review.objects.filter(customer=user, product=product).exists():
            raise serializers.ValidationError("You have already reviewed this product.")

        return attrs

    def create(self, validated_data):
        user = self.context.get('request').user
        validated_data['customer'] = user
        validated_data['is_verified_purchase'] = True
        return super().create(validated_data)
