from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.promotions.models import Promotion
from apps.promotions.serializers import PromotionSerializer, CouponValidationSerializer
from apps.promotions.services import PromotionService
from apps.common.permissions import IsSeller, IsSuperAdmin
from apps.carts.models import Cart

class SellerPromotionViewSet(viewsets.ModelViewSet):
    """
    CRUD for a vendor's own promotions.
    """
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated, IsSeller]

    def get_queryset(self):
        return Promotion.objects.filter(vendor=self.request.user.vendor_profile).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user.vendor_profile)

class AdminPromotionViewSet(viewsets.ModelViewSet):
    """
    List for admins, with ability to toggle active status via PATCH.
    """
    http_method_names = ['get', 'patch']
    queryset = Promotion.objects.all().order_by('-created_at')
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def update(self, request, *args, **kwargs):
        # Allow admins to only patch the is_active flag
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        # Limit what admin can change
        if 'is_active' in request.data:
            instance.is_active = request.data['is_active']
            instance.save(update_fields=['is_active'])
            return Response(self.get_serializer(instance).data)
        return Response({"detail": "Admins can only toggle is_active status."}, status=status.HTTP_400_BAD_REQUEST)

class CouponValidationView(generics.GenericAPIView):
    """
    Public endpoint to validate a coupon against a cart.
    """
    serializer_class = CouponValidationSerializer
    permission_classes = [] # Open to anyone with a cart

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        coupon_code = serializer.validated_data['coupon_code']
        cart_id = serializer.validated_data['cart_id']

        try:
            cart = Cart.objects.get(id=cart_id)
        except Cart.DoesNotExist:
            return Response({"detail": "Cart not found."}, status=status.HTTP_404_NOT_FOUND)

        cart_items = cart.items.select_related('variant__product__vendor').all()
        
        customer = request.user if request.user.is_authenticated else None
        
        result = PromotionService.validate_coupon(
            coupon_code=coupon_code,
            customer=customer,
            cart_items=cart_items
        )

        if not result['valid']:
            return Response({"valid": False, "detail": result['error']}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "valid": True,
            "discount_amount": result['discount_amount'],
            "applicable_subtotal": result['applicable_subtotal'],
            "promotion_name": result['promotion'].name
        })
