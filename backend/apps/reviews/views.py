from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count
from apps.reviews.models import Review, ReviewReply, ReviewHelpfulVote
from apps.reviews.serializers import ReviewSerializer, ReviewWriteSerializer, ReviewReplySerializer
from apps.catalog.models import Product
from apps.orders.models import OrderItem
from apps.common.permissions import IsOperationalAdmin

class ProductReviewListView(generics.ListAPIView):
    """Publicly viewable approved reviews for a specific product."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        return Review.objects.filter(product__slug=slug, is_approved=True)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Calculate histogram
        slug = self.kwargs.get('slug')
        qs = self.get_queryset()
        distribution = qs.values('rating').annotate(count=Count('id'))
        
        hist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for item in distribution:
            hist[item['rating']] = item['count']
            
        # Add to paginated response
        response.data['rating_distribution'] = hist
        return response


class ReviewEligibilityView(APIView):
    """Checks if the current user can review a product."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_active:
            return Response({
                "eligible": False,
                "has_reviewed": False,
                "reason": "Your account is suspended."
            })

        slug = request.query_params.get('product_slug')
        if not slug:
            return Response({"error": "product_slug is required"}, status=400)
            
        product = get_object_or_404(Product, slug=slug)
        user = request.user
        
        existing_review = Review.objects.filter(customer=user, product=product).first()
        if existing_review:
            return Response({
                "eligible": False,
                "has_reviewed": True,
                "existing_review_id": str(existing_review.id)
            })
            
        has_purchased = OrderItem.objects.filter(
            vendor_sub_order__order__customer=user,
            variant__product=product,
            status='DELIVERED'
        ).exists()
        
        return Response({
            "eligible": has_purchased,
            "has_reviewed": False,
            "existing_review_id": None
        })


class ReviewCreateView(generics.CreateAPIView):
    """Creates a new review."""
    serializer_class = ReviewWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if not request.user.is_active:
            return Response(
                {"error": "Your account is suspended. Review submissions are disabled."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


class CustomerReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Allows a customer to edit/delete their own review."""
    serializer_class = ReviewWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(customer=self.request.user)


class CustomerReviewListView(generics.ListAPIView):
    """Lists a customer's own reviews."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(customer=self.request.user)


class SellerReviewListView(generics.ListAPIView):
    """Lists reviews for a seller's products."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated] # Should be IsSellerUser but keeping it simple for now

    def get_queryset(self):
        # Assuming request.user has vendor_profile
        vendor = getattr(self.request.user, 'vendor_profile', None)
        if not vendor:
            return Review.objects.none()
        return Review.objects.filter(product__vendor=vendor)


class SellerReplyCreateView(APIView):
    """Allows a seller to reply to a review."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        vendor = getattr(self.request.user, 'vendor_profile', None)
        if not vendor:
            return Response({"error": "Only sellers can reply."}, status=403)
            
        review = get_object_or_404(Review, pk=pk)
        if review.product.vendor != vendor:
            return Response({"error": "Not your product."}, status=403)
            
        body = request.data.get('body')
        if not body:
            return Response({"error": "Body is required."}, status=400)
            
        reply, created = ReviewReply.objects.update_or_create(
            review=review,
            defaults={'seller': vendor, 'body': body}
        )
        return Response(ReviewReplySerializer(reply).data)


class AdminReviewListView(generics.ListAPIView):
    """Admin view to list all reviews for moderation."""
    serializer_class = ReviewSerializer
    permission_classes = [IsOperationalAdmin]
    queryset = Review.objects.all()


class AdminModerateReviewView(APIView):
    """Admin view to approve/reject a review."""
    permission_classes = [IsOperationalAdmin]

    def patch(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        is_approved = request.data.get('is_approved')
        if is_approved is not None:
            review.is_approved = bool(is_approved)
            review.save()
            return Response({"status": "updated", "is_approved": review.is_approved})
        return Response({"error": "is_approved field is required."}, status=400)


class ReviewHelpfulView(APIView):
    """Mark a review as helpful."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        _, created = ReviewHelpfulVote.objects.get_or_create(review=review, customer=request.user)
        if created:
            review.helpful_count += 1
            review.save(update_fields=['helpful_count'])
        return Response({"status": "success", "helpful_count": review.helpful_count})
