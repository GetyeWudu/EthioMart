from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import WishlistItem
from .serializers import WishlistItemSerializer, WishlistSyncSerializer
from apps.catalog.models import Product

class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return WishlistItem.objects.filter(
            customer=self.request.user,
            product__status='ACTIVE'
        ).select_related('product')

class WishlistIdsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ids = WishlistItem.objects.filter(
            customer=request.user, 
            product__status='ACTIVE'
        ).values_list('product_id', flat=True)
        return Response(list(ids))

class WishlistToggleView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_active:
            return Response(
                {"error": "Your account is suspended. Wishlist modifications are disabled."},
                status=status.HTTP_403_FORBIDDEN
            )

        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
            
        item = WishlistItem.all_objects.filter(customer=request.user, product=product).first()
        
        if item:
            if item.deleted_at is None:
                item.delete()  # Soft deletes it
                return Response({"saved": False})
            else:
                item.deleted_at = None
                item.save()
                return Response({"saved": True})
        else:
            WishlistItem.objects.create(customer=request.user, product=product)
            return Response({"saved": True})

class WishlistSyncView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_active:
            return Response(
                {"error": "Your account is suspended. Wishlist modifications are disabled."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = WishlistSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product_ids = set(serializer.validated_data['product_ids'])
        valid_products = list(Product.objects.filter(id__in=product_ids))
        
        with transaction.atomic():
            # Restore any soft-deleted ones
            existing_items = WishlistItem.all_objects.filter(
                customer=request.user,
                product__in=valid_products
            )
            existing_items.update(deleted_at=None)
            
            existing_product_ids = set(existing_items.values_list('product_id', flat=True))
            
            # Create the ones that don't exist at all
            new_items = []
            for p in valid_products:
                if p.id not in existing_product_ids:
                    new_items.append(WishlistItem(customer=request.user, product=p))
                    
            if new_items:
                WishlistItem.objects.bulk_create(new_items, ignore_conflicts=True)
            
        return Response({"success": True})
