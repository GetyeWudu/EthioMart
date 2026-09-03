from django.urls import path
from .views import WishlistListView, WishlistIdsView, WishlistToggleView, WishlistSyncView

urlpatterns = [
    path('wishlists/', WishlistListView.as_view(), name='wishlist-list'),
    path('wishlists/ids/', WishlistIdsView.as_view(), name='wishlist-ids'),
    path('wishlists/toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
    path('wishlists/sync/', WishlistSyncView.as_view(), name='wishlist-sync'),
]
