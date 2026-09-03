from django.urls import path
from apps.reviews.views import (
    ProductReviewListView,
    ReviewEligibilityView,
    ReviewCreateView,
    CustomerReviewDetailView,
    CustomerReviewListView,
    SellerReviewListView,
    SellerReplyCreateView,
    AdminReviewListView,
    AdminModerateReviewView,
    ReviewHelpfulView,
)

app_name = 'reviews'

urlpatterns = [
    # Public
    path('products/<slug:slug>/reviews/', ProductReviewListView.as_view(), name='product-reviews'),
    
    # Customer
    path('reviews/eligibility/', ReviewEligibilityView.as_view(), name='review-eligibility'),
    path('reviews/', ReviewCreateView.as_view(), name='review-create'),
    path('reviews/<uuid:pk>/', CustomerReviewDetailView.as_view(), name='review-detail'),
    path('customer/reviews/', CustomerReviewListView.as_view(), name='customer-reviews'),
    path('reviews/<uuid:pk>/helpful/', ReviewHelpfulView.as_view(), name='review-helpful'),
    
    # Seller
    path('seller/reviews/', SellerReviewListView.as_view(), name='seller-reviews'),
    path('seller/reviews/<uuid:pk>/reply/', SellerReplyCreateView.as_view(), name='seller-reply'),
    
    # Admin
    path('admin/reviews/', AdminReviewListView.as_view(), name='admin-reviews'),
    path('admin/reviews/<uuid:pk>/moderate/', AdminModerateReviewView.as_view(), name='admin-moderate-review'),
]
