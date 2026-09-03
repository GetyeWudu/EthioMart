from rest_framework import viewsets, status, views
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.exceptions import ValidationError
from apps.carts.models import Cart, CartItem
from apps.carts.serializers import CartSerializer, CartItemSerializer
from apps.carts.services import CartService

class CartViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    def list(self, request):
        session_key = request.META.get('HTTP_X_SESSION_KEY')
        user = request.user if request.user.is_authenticated else None
        
        try:
            cart = CartService.get_or_create_cart(user=user, session_key=session_key)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def merge(self, request):
        session_key = request.data.get('session_key')
        if not session_key or not request.user.is_authenticated:
            return Response({"detail": "Requires authenticated user and session_key."}, status=status.HTTP_400_BAD_REQUEST)
        
        cart = CartService.merge_guest_cart(session_key, request.user)
        if cart:
            return Response(CartSerializer(cart).data)
        return Response({"detail": "No guest cart found to merge."}, status=status.HTTP_404_NOT_FOUND)

class CartItemViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = CartItemSerializer
    queryset = CartItem.objects.all()

    def get_queryset(self):
        user = self.request.user if self.request.user.is_authenticated else None
        session_key = self.request.META.get('HTTP_X_SESSION_KEY')
        try:
            cart = CartService.get_or_create_cart(user=user, session_key=session_key)
            return self.queryset.filter(cart=cart)
        except ValueError:
            return self.queryset.none()

    def create(self, request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_active:
            return Response(
                {"detail": "Your account is suspended. Adding items to cart is disabled."},
                status=status.HTTP_403_FORBIDDEN
            )

        user = request.user if request.user.is_authenticated else None
        session_key = request.META.get('HTTP_X_SESSION_KEY')
        try:
            cart = CartService.get_or_create_cart(user=user, session_key=session_key)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        variant = serializer.validated_data['variant']
        quantity = serializer.validated_data.get('quantity', 1)
        selected_facility = serializer.validated_data.get('selected_facility')

        try:
            item = CartService.add_item_to_cart(cart, variant, quantity, selected_facility)
            return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        if request.user.is_authenticated and not request.user.is_active:
            return Response(
                {"detail": "Your account is suspended. Cart modifications are disabled."},
                status=status.HTTP_403_FORBIDDEN
            )
        item = self.get_object()
        quantity = request.data.get('quantity')
        if quantity is not None:
            try:
                quantity = int(quantity)
                CartService.validate_stock_for_cart_item(item.variant, quantity)
                item.quantity = quantity
                item.save()
            except (ValueError, ValidationError) as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(CartItemSerializer(item).data)
