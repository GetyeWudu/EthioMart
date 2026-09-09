from decimal import Decimal
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.vendors.services.vendor_service import VendorService
from apps.vendors.enums import VendorStatus
from apps.common.permissions import IsSellerUser, IsAdminUser
from apps.catalog.models import (
    Category,
    Brand,
    Attribute,
    AttributeValue,
    CategoryAttribute,
    Product,
    ProductVariant,
    ProductImage,
)
from apps.catalog.enums import ProductStatus, ProductType
from apps.catalog.services.taxonomy_service import TaxonomyService
from apps.catalog.services.product_service import ProductService
from apps.catalog.services.product_approval_service import ProductApprovalService
from apps.catalog.services.product_update_moderation_service import ProductUpdateModerationService
from apps.notifications.services import NotificationService
from apps.notifications.models import Notification
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.catalog.serializers import (
    CategoryDetailSerializer,
    CategoryCreateSerializer,
    LeafCategorySerializer,
    BrandSerializer,
    AttributeSerializer,
    AttributeCreateSerializer,
    AttributeValueSerializer,
    CategoryAttributeSerializer,
    CategoryAttributeBindSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductImageSerializer,
    ProductRejectSerializer,
    AdminCategoryAttributeSerializer,
)
from apps.inventory.models import WarehouseLocation
from apps.promotions.models import Promotion
from django.utils import timezone
# ===========================================================================
# 1. Public Storefront Endpoints
# ===========================================================================

class CategoryTreeAPIView(APIView):
    """Returns the complete nested category taxonomy tree cached in Redis."""
    permission_classes = [AllowAny]

    def get(self, request):
        tree = TaxonomyService.get_nested_tree()
        return Response(tree, status=status.HTTP_200_OK)


class RootCategoryListAPIView(APIView):
    """Returns top-level (root) categories for seller registration and filtering."""
    permission_classes = [AllowAny]

    def get(self, request):
        roots = Category.objects.filter(depth=1, is_active=True).order_by("display_order", "name")
        data = [
            {
                "id": str(r.id),
                "name": r.name,
                "name_am": r.name_am,
                "slug": r.slug,
                "icon": r.icon,
            }
            for r in roots
        ]
        return Response(data, status=status.HTTP_200_OK)


class LeafCategoriesView(APIView):
    """Returns leaf categories scoped to the seller's allowed root verticals."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Category.objects.filter(is_active=True)
        if request.user.is_authenticated and hasattr(request.user, "vendor_profile"):
            vendor = VendorService.get_or_create_profile(request.user)
            if vendor and vendor.allowed_categories.exists():
                allowed_roots = vendor.allowed_categories.all()
                allowed_leaf_ids = []
                for root_cat in allowed_roots:
                    descendants = root_cat.get_descendants()
                    leaf_nodes = [node.id for node in descendants if node.is_leaf_node()]
                    if not leaf_nodes and root_cat.is_leaf_node():
                        leaf_nodes = [root_cat.id]
                    allowed_leaf_ids.extend(leaf_nodes)
                qs = qs.filter(id__in=set(allowed_leaf_ids))
                return Response(LeafCategorySerializer(qs, many=True).data, status=status.HTTP_200_OK)
        # Default: all active leaf nodes
        leaf_ids = [cat.id for cat in qs if cat.is_leaf_node()]
        qs = qs.filter(id__in=leaf_ids)
        return Response(LeafCategorySerializer(qs, many=True).data, status=status.HTTP_200_OK)



class CategoryDetailAPIView(APIView):
    """Returns category details, breadcrumbs, and bound attributes."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        category = get_object_or_404(Category, slug=slug, is_active=True)
        serializer = CategoryDetailSerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CategoryBrandsAPIView(APIView):
    """
    Returns brands scoped to a given category.
    Walks up the ancestor chain and returns all brands whose categories M2M
    intersects any ancestor (or the leaf itself). Also includes global brands
    (brands with zero categories assigned).
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk, is_active=True)
        # All ancestors plus self (MP_Node.get_ancestors() returns QuerySet of ancestors)
        ancestor_ids = list(category.get_ancestors().values_list("id", flat=True)) + [category.id]

        # Brands scoped to any ancestor, plus global brands (zero categories assigned)
        from django.db.models import Q
        from apps.catalog.serializers import BrandSerializer as BS
        all_brands = Brand.objects.filter(
            Q(categories__id__in=ancestor_ids) | Q(categories__isnull=True)
        ).distinct().order_by("name")
        return Response(BS(all_brands, many=True).data, status=status.HTTP_200_OK)


class CategoryAttributesAPIView(APIView):
    """Returns bound attributes for a given category (by ID), optionally filtered."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        
        # Resolve ancestor category IDs up to root
        ancestor_ids = list(category.get_ancestors().values_list("id", flat=True)) + [category.id]
        
        qs = CategoryAttribute.objects.filter(category_id__in=ancestor_ids).select_related("attribute").prefetch_related("attribute__values")
        
        is_variant = request.query_params.get("is_variant_creator")
        if is_variant in ["true", "True", "1"]:
            qs = qs.filter(is_variant_creator=True)
            
        vendor_id = request.user.vendor_profile.id if request.user.is_authenticated and hasattr(request.user, 'vendor_profile') else None
        
        # Support extra product-level IDs
        extra_attr_ids = request.query_params.get("extra_attribute_ids")
        extra_qs = None
        if extra_attr_ids:
            id_list = [i.strip() for i in extra_attr_ids.split(',') if i.strip()]
            from apps.catalog.models import Attribute
            extra_qs = Attribute.objects.filter(id__in=id_list).prefetch_related("values")

        data = CategoryAttributeSerializer(qs, many=True).data
        for item in data:
            item["attribute"]["values"] = [
                v for v in item["attribute"]["values"]
                if v.get("is_global") or (vendor_id and v.get("vendor") == vendor_id)
            ]
            
        if extra_qs:
            from apps.catalog.serializers import AttributeSerializer
            for attr in extra_qs:
                attr_data = AttributeSerializer(attr).data
                attr_data["values"] = [
                    v for v in attr_data["values"]
                    if v.get("is_global") or (vendor_id and v.get("vendor") == vendor_id)
                ]
                data.append({
                    "attribute": attr_data,
                    "is_variant_creator": True,
                    "is_required": False,
                    "is_filterable": True,
                })
                
        return Response(data, status=status.HTTP_200_OK)


class BrandListCreateAPIView(APIView):
    """Returns brands scoped to the user or globally, allows inline creation for sellers."""
    permission_classes = [AllowAny]

    def get(self, request):
        vendor_id = request.user.vendor_profile.id if request.user.is_authenticated and hasattr(request.user, 'vendor_profile') else None
        brands = Brand.objects.filter(
            Q(is_global=True) | Q(vendor_id=vendor_id)
        ).distinct().order_by("name")
        serializer = BrandSerializer(brands, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user.is_authenticated or not hasattr(request.user, 'vendor_profile'):
            return Response({"detail": "Only sellers can create custom brands."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BrandSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(vendor=request.user.vendor_profile, is_global=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerAttributeValueCreateAPIView(APIView):
    """Allows sellers to create custom attribute values inline."""
    permission_classes = [IsSellerUser]

    def post(self, request, pk):
        attribute = get_object_or_404(Attribute, pk=pk)
        val_name = request.data.get("value", "").strip()
        if not val_name:
            return Response({"detail": "Value is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        existing = AttributeValue.objects.filter(
            attribute=attribute,
            value__iexact=val_name
        ).filter(Q(is_global=True) | Q(vendor=request.user.vendor_profile)).first()
        
        if existing:
            return Response(AttributeValueSerializer(existing).data, status=status.HTTP_200_OK)
            
        new_val = AttributeValue.objects.create(
            attribute=attribute,
            value=val_name,
            vendor=request.user.vendor_profile,
            is_global=False
        )
        return Response(AttributeValueSerializer(new_val).data, status=status.HTTP_201_CREATED)


class PublicProductListAPIView(APIView):
    """
    Public filterable product search.
    Supports filtering by category, brand, vendor, search term, price range.
    Uses live_on_storefront() to automatically exclude suspended/inactive vendors.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Product.objects.live_on_storefront().select_related(
            "vendor", "category", "brand"
        ).prefetch_related("images", "variants__warehouse_stocks")

        # Category filter (including subcategories)
        cat_slug = request.query_params.get("category")
        if cat_slug:
            cat = Category.objects.filter(slug=cat_slug, is_active=True).first()
            if cat:
                # Include all descendants in treebeard
                descendants = cat.get_descendants()
                cat_ids = [cat.id] + [d.id for d in descendants]
                qs = qs.filter(category_id__in=cat_ids)

        # Brand filter
        brand_slug = request.query_params.get("brand")
        if brand_slug:
            qs = qs.filter(brand__slug=brand_slug)

        # Vendor filter
        vendor_slug = request.query_params.get("vendor")
        if vendor_slug:
            qs = qs.filter(vendor__slug=vendor_slug)

        # Search query
        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(brand__name__icontains=search)
            )

        # Price range
        min_price = request.query_params.get("min_price")
        if min_price:
            qs = qs.filter(variants__price__gte=Decimal(min_price))

        max_price = request.query_params.get("max_price")
        if max_price:
            qs = qs.filter(variants__price__lte=Decimal(max_price))

        # In stock only
        if request.query_params.get("in_stock") == "true":
            qs = qs.filter(variants__warehouse_stocks__quantity_available__gt=0)

        # Featured
        if request.query_params.get("featured") == "true":
            qs = qs.filter(is_featured=True)
            
        # Specific IDs (useful for guest wishlists)
        ids = request.query_params.get("ids")
        if ids:
            id_list = [i.strip() for i in ids.split(',') if i.strip()]
            qs = qs.filter(id__in=id_list)

        qs = qs.distinct()

        # Database-level basic sorting
        sort = request.query_params.get("sort", "").lower().strip()
        if sort in ("new", "newest"):
            qs = qs.order_by("-created_at")
        elif sort == "rating":
            qs = qs.order_by("-avg_rating")
        elif sort == "trending":
            qs = qs.order_by("-is_featured", "-review_count", "-avg_rating", "-created_at")
        
        # Pre-fetch active automatic promotions to prevent N+1 queries
        now = timezone.now()
        active_promotions = list(Promotion.objects.filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(expires_at__isnull=True) | Q(expires_at__gte=now),
            is_active=True,
            is_coupon_required=False
        ).prefetch_related('scope_products', 'scope_categories'))

        serializer = ProductListSerializer(qs[:150], many=True, context={'active_promotions': active_promotions})
        data = list(serializer.data)

        # Deals / On Sale filtering
        is_deals = request.query_params.get("deals") == "true" or request.query_params.get("on_sale") == "true"
        if is_deals:
            data = [item for item in data if (item.get("discount_percentage") or 0) > 0]

        # Python-level Sorting for calculated dynamic fields (effective_price, discount_percentage)
        if sort in ("discount", "biggest_discount"):
            data.sort(key=lambda x: (x.get("discount_percentage") or 0, float(x.get("effective_price") or 0)), reverse=True)
        elif sort in ("price-low", "price_asc"):
            data.sort(key=lambda x: float(x.get("effective_price") or x.get("min_price") or 0))
        elif sort in ("price-high", "price_desc"):
            data.sort(key=lambda x: float(x.get("effective_price") or x.get("max_price") or 0), reverse=True)

        return Response(data, status=status.HTTP_200_OK)


class PublicProductDetailAPIView(APIView):
    """Returns full public product detail by slug for approved and active vendors."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(
            Product.objects.live_on_storefront().select_related("vendor", "category", "brand").prefetch_related(
                "images", "variants__attribute_values", "variants__warehouse_stocks", "specifications__attribute", "specifications__attribute_value"
            ),
            slug=slug
        )
        
        # Pre-fetch active automatic promotions to prevent N+1 queries
        now = timezone.now()
        active_promotions = list(Promotion.objects.filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(expires_at__isnull=True) | Q(expires_at__gte=now),
            is_active=True,
            is_coupon_required=False
        ).prefetch_related('scope_products', 'scope_categories'))
        
        serializer = ProductDetailSerializer(product, context={'active_promotions': active_promotions})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicProductRecommendationsAPIView(APIView):
    """
    Returns recommendations for a product:
    1. similar_items: in the same leaf category (or fallback to parent/ancestor categories), max 6.
    2. store_items: more products from the same vendor, max 6.
    Bounded and optimized with select_related and prefetch_related.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        product = get_object_or_404(
            Product.objects.live_on_storefront().select_related("category", "vendor"),
            slug=slug
        )

        base_qs = (
            Product.objects.live_on_storefront()
            .exclude(id=product.id)
            .select_related("vendor", "category", "brand")
            .prefetch_related("images", "variants__warehouse_stocks")
        )

        # 1. Similar items in same leaf category (or fallback to parent/root or trending)
        category_ids = [product.category_id]
        if hasattr(product.category, "get_parent") and callable(product.category.get_parent):
            parent = product.category.get_parent()
            if parent:
                category_ids.extend([d.id for d in parent.get_descendants()])
                category_ids.append(parent.id)
        if len(category_ids) <= 1 and hasattr(product.category, "get_root") and callable(product.category.get_root):
            root = product.category.get_root()
            if root:
                category_ids.extend([d.id for d in root.get_descendants()])
                category_ids.append(root.id)

        similar_items = list(
            base_qs.filter(category_id__in=category_ids)
            .order_by("-created_at")[:6]
        )

        # Backfill if fewer than 3 to guarantee rich carousel
        if len(similar_items) < 3:
            existing_ids = {product.id} | {item.id for item in similar_items}
            backfill = list(
                base_qs.exclude(id__in=existing_ids)
                .order_by("-is_featured", "-avg_rating", "-created_at")[:(6 - len(similar_items))]
            )
            similar_items.extend(backfill)

        # 2. More from this merchant
        store_items = list(
            base_qs.filter(vendor_id=product.vendor_id)
            .order_by("-created_at")[:6]
        )

        now = timezone.now()
        active_promotions = list(Promotion.objects.filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(expires_at__isnull=True) | Q(expires_at__gte=now),
            is_active=True,
            is_coupon_required=False
        ).prefetch_related('scope_products', 'scope_categories'))

        context = {"request": request, "active_promotions": active_promotions}
        return Response({
            "similar_items": ProductListSerializer(similar_items, many=True, context=context).data,
            "store_items": ProductListSerializer(store_items, many=True, context=context).data,
        }, status=status.HTTP_200_OK)


# ===========================================================================
# 2. Seller Portal Endpoints
# ===========================================================================

class SellerProductListCreateAPIView(APIView):
    """Allows sellers to list and create products for their store."""
    permission_classes = [IsAuthenticated, IsSellerUser]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # Use all_objects to access soft-deleted (archived) products
        products = Product.all_objects.filter(vendor=vendor).select_related(
            "category", "brand"
        ).prefetch_related("images", "variants__warehouse_stocks")

        archived = request.query_params.get("archived")
        if archived == "true":
            products = products.filter(deleted_at__isnull=False)
        else:
            products = products.filter(deleted_at__isnull=True)

        status_filter = request.query_params.get("status")
        if status_filter:
            products = products.filter(status=status_filter)

        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if not vendor:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if vendor.status != VendorStatus.APPROVED:
            return Response(
                {
                    "error": "Your merchant KYC documents must be submitted and approved by administration before you can create or list products.",
                    "status": vendor.status,
                },
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Strict fallback: even if admin bypassed status, ensure documents exist!
        from apps.vendors.enums import VendorType
        if vendor.vendor_type != VendorType.PLATFORM:
            try:
                from apps.vendors.services.kyc_service import KYCVerificationService
                KYCVerificationService._validate_kyc_documents(vendor)
            except Exception as e:
                return Response(
                    {
                        "error": f"Incomplete KYC Profile: {str(e)} You must upload all required documents before posting products, even if approved.",
                        "status": vendor.status,
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = ProductCreateSerializer(data=request.data)
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        category = get_object_or_404(Category, id=data["category_id"], is_active=True)
        suggested_category = data.get("suggested_category", "").strip()
        if suggested_category:
            existing_child = category.get_children().filter(name__iexact=suggested_category).first()
            if existing_child:
                category = existing_child
            else:
                import uuid
                from django.utils.text import slugify
                from apps.catalog.services.taxonomy_service import TaxonomyService
                base_slug = slugify(suggested_category) or f"cat-{uuid.uuid4().hex[:6]}"
                slug = base_slug
                if Category.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
                category = TaxonomyService.create_child_category(
                    parent=category,
                    name=suggested_category,
                    slug=slug,
                )

        brand = None
        brand_id = data.get("brand_id")
        if brand_id and str(brand_id).strip().lower() not in ["", "none", "null", "create_new"]:
            try:
                brand = Brand.objects.filter(id=brand_id).first()
            except Exception:
                pass

        new_brand_name = data.get("new_brand_name", "").strip()
        if not brand and new_brand_name:
            existing_brand = Brand.objects.filter(name__iexact=new_brand_name, vendor=vendor).first()
            if existing_brand:
                brand = existing_brand
            else:
                import uuid
                from django.utils.text import slugify
                base_slug = slugify(new_brand_name) or f"brand-{uuid.uuid4().hex[:6]}"
                slug = base_slug
                if Brand.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
                brand = Brand.objects.create(
                    name=new_brand_name,
                    slug=slug,
                    vendor=vendor,
                    is_global=False
                )

        warehouse = None
        if data.get("warehouse_id"):
            warehouse = get_object_or_404(WarehouseLocation, id=data["warehouse_id"], vendor=vendor)

        try:
            if data.get("product_type") == ProductType.SIMPLE:
                product = ProductService.create_simple_product(
                    vendor=vendor,
                    category=category,
                    title=data["title"],
                    price=data.get("price", Decimal("0.00")),
                    sku=data.get("sku"),
                    compare_at_price=data.get("compare_at_price"),
                    stock_quantity=data.get("initial_stock", 0),
                    warehouse=warehouse,
                    brand=brand,
                    short_description=data.get("short_description", ""),
                    description=data["description"],
                    shipping_class=data.get("shipping_class", "STANDARD"),
                    length_cm=data.get("length_cm", Decimal("15.0")),
                    width_cm=data.get("width_cm", Decimal("10.0")),
                    height_cm=data.get("height_cm", Decimal("5.0")),
                    weight_kg=data.get("weight_kg", Decimal("0.500")),
                    specifications=data.get("specifications", []),
                    custom_specifications=data.get("custom_specifications", {}),
                    suggested_category=suggested_category,
                )
            else:
                product = ProductService.create_configurable_product(
                    vendor=vendor,
                    category=category,
                    title=data["title"],
                    brand=brand,
                    short_description=data.get("short_description", ""),
                    description=data["description"],
                    shipping_class=data.get("shipping_class", "STANDARD"),
                    length_cm=data.get("length_cm", Decimal("15.0")),
                    width_cm=data.get("width_cm", Decimal("10.0")),
                    height_cm=data.get("height_cm", Decimal("5.0")),
                    specifications=data.get("specifications", []),
                    custom_specifications=data.get("custom_specifications", {}),
                    warehouse=warehouse,
                    variants_data=data.get("variants", []),
                    suggested_category=suggested_category,
                )

            detail_serializer = ProductDetailSerializer(product)
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SellerProductDetailAPIView(APIView):
    """Allows sellers to view, edit, and soft-delete their product."""
    permission_classes = [IsAuthenticated, IsSellerUser]

    def get(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        product = get_object_or_404(Product, pk=pk, vendor=vendor)
        serializer = ProductDetailSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        if vendor.status != VendorStatus.APPROVED:
            return Response(
                {"error": "Product modifications are disabled until your store KYC is verified and APPROVED by administration."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Strict fallback: even if admin bypassed status, ensure documents exist!
        from apps.vendors.enums import VendorType
        if vendor.vendor_type != VendorType.PLATFORM:
            try:
                from apps.vendors.services.kyc_service import KYCVerificationService
                KYCVerificationService._validate_kyc_documents(vendor)
            except Exception as e:
                return Response(
                    {"error": f"Incomplete KYC Profile: {str(e)} You must upload all required documents before modifying products, even if approved."},
                    status=status.HTTP_403_FORBIDDEN
                )
        product = get_object_or_404(Product, pk=pk, vendor=vendor)

        # Snapshot old data for moderation service
        old_data = {
            "title": product.title,
            "description": product.description,
            "short_description": product.short_description,
        }

        with transaction.atomic():
            # 1. Update basic fields
            for field in ["title", "short_description", "description", "warranty_period_days", "origin_country"]:
                if field in request.data:
                    setattr(product, field, request.data[field])
            
            # 2. Update custom specifications
            if "custom_specifications" in request.data:
                product.custom_specifications = request.data["custom_specifications"]

            # 3. Update variants if provided
            if "variants_data" in request.data:
                for v_data in request.data["variants_data"]:
                    try:
                        variant = ProductVariant.objects.get(id=v_data.get("id"), product=product)
                        if "price" in v_data:
                            variant.price = v_data["price"]
                        if "compare_at_price" in v_data:
                            variant.compare_at_price = v_data["compare_at_price"]
                        if "weight_kg" in v_data:
                            variant.weight_kg = v_data["weight_kg"]
                        variant.save()
                    except ProductVariant.DoesNotExist:
                        pass

            # 4. Handle image deletions
            if "delete_images" in request.data:
                delete_ids = request.data["delete_images"]
                if isinstance(delete_ids, list):
                    ProductImage.objects.filter(product=product, id__in=delete_ids).delete()

            # 5. Handle setting primary image
            if "primary_image_id" in request.data:
                primary_id = request.data["primary_image_id"]
                ProductImage.objects.filter(product=product, is_primary=True).update(is_primary=False)
                ProductImage.objects.filter(product=product, id=primary_id).update(is_primary=True)
            
            product.save()

            # Evaluate Moderation Risk
            action_taken, new_status, is_published, flags = ProductUpdateModerationService.route_update(
                product, old_data, request.data, vendor
            )
            
            if product.status != new_status:
                product.status = new_status
                product.save()

            if action_taken == "AUTO_APPROVED" and len(flags) > 0:
                # This means it was a PASSIVE_AUDIT for a Trusted Seller
                User = get_user_model()
                admins = User.objects.filter(is_staff=True, is_active=True)
                NotificationService.send_bulk_notification(
                    users=admins,
                    type=Notification.NotificationType.SYSTEM_ALERT,
                    title="Passive Audit Alert",
                    message=f"Trusted seller '{vendor.store_name}' made a major edit to '{product.title}'.",
                    related_link=f"/admin/products/{product.id}"
                )

        # Return appropriate response payload
        if action_taken == "PULLED_FOR_REVIEW":
            User = get_user_model()
            admins = User.objects.filter(is_staff=True, is_active=True)
            NotificationService.send_bulk_notification(
                users=admins,
                type=Notification.NotificationType.SYSTEM_ALERT,
                title="High-Risk Edit: Product Pulled",
                message=f"Probationary seller '{vendor.store_name}' attempted a major edit on '{product.title}'. The product has been pulled offline for review. Reasons: {', '.join(flags)}",
                related_link=f"/admin/products/{product.id}"
            )
            return Response({
                "success": True,
                "action_taken": "PULLED_FOR_REVIEW",
                "product_status": new_status,
                "is_published": False,
                "flagged_reasons": flags,
                "message": "Your changes have been submitted for review. As a probationary seller, major updates require standard verification before republishing."
            }, status=status.HTTP_202_ACCEPTED)

        # Normal Auto-Approved Response
        return Response({
            "success": True,
            "action_taken": "AUTO_APPROVED",
            "product_status": new_status,
            "is_published": True,
            "message": "Product listing updated successfully."
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        product = get_object_or_404(Product, pk=pk, vendor=vendor)
        result = ProductService.delete_product(product)
        return Response({
            "message": "Product successfully deleted or archived.",
            "result": result
        }, status=status.HTTP_200_OK)


class SellerProductSubmitAPIView(APIView):
    """Submits a draft/rejected product to the 4-Layer Product Auto-Approval Engine."""
    permission_classes = [IsAuthenticated, IsSellerUser]

    def post(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        if vendor.status != VendorStatus.APPROVED:
            return Response(
                {"error": "Submitting products for approval is disabled until your store is APPROVED by administration."},
                status=status.HTTP_403_FORBIDDEN
            )
        product = get_object_or_404(Product, pk=pk, vendor=vendor)

        new_status, result = ProductApprovalService.evaluate_and_process(product)
        if new_status == ProductStatus.DRAFT:
            return Response({"errors": result}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            "status": new_status,
            "message": result,
            "product_id": str(product.id)
        }, status=status.HTTP_200_OK)


class SellerProductImageUploadAPIView(APIView):
    """Uploads gallery or primary image for a seller's product."""
    permission_classes = [IsAuthenticated, IsSellerUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        if vendor.status != VendorStatus.APPROVED:
            return Response(
                {"error": "Uploading product images is disabled until your store is APPROVED by administration."},
                status=status.HTTP_403_FORBIDDEN
            )
        product = get_object_or_404(Product, pk=pk, vendor=vendor)

        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"error": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)

        is_primary = request.data.get("is_primary") in [True, "true", "True", 1, "1"]
        if is_primary:
            product.images.filter(is_primary=True).update(is_primary=False)

        img = ProductImage.objects.create(
            product=product,
            image=image_file,
            alt_text=request.data.get("alt_text", product.title),
            is_primary=is_primary,
            display_order=int(request.data.get("display_order", 0))
        )
        return Response(ProductImageSerializer(img).data, status=status.HTTP_201_CREATED)


# ===========================================================================
# 3. Admin Moderation & Taxonomy Endpoints
# ===========================================================================

class AdminCategoryCreateAPIView(APIView):
    """Allows admins to create root or child categories."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = CategoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        parent_id = data.get("parent_id")
        if parent_id:
            parent = get_object_or_404(Category, id=parent_id)
            cat = TaxonomyService.create_child_category(
                parent=parent,
                name=data["name"],
                name_am=data.get("name_am", ""),
                slug=data.get("slug"),
                icon=data.get("icon", ""),
                commission_rate_override=data.get("commission_rate_override"),
                display_order=data.get("display_order", 0)
            )
        else:
            cat = TaxonomyService.create_root_category(
                name=data["name"],
                name_am=data.get("name_am", ""),
                slug=data.get("slug"),
                icon=data.get("icon", ""),
                commission_rate_override=data.get("commission_rate_override"),
                display_order=data.get("display_order", 0)
            )

        return Response(CategoryDetailSerializer(cat).data, status=status.HTTP_201_CREATED)


class AdminCategoryUpdateAPIView(APIView):
    """Allows admins to update category details and re-parent using Treebeard."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        data = request.data

        # Update standard fields
        if "name" in data:
            category.name = data["name"]
        if "name_am" in data:
            category.name_am = data["name_am"]
        if "slug" in data:
            category.slug = data["slug"]
        if "icon" in data:
            category.icon = data["icon"]
        if "commission_rate_override" in data:
            comm_val = data["commission_rate_override"]
            category.commission_rate_override = comm_val if (comm_val is not None and str(comm_val).strip() != "") else None
        if "display_order" in data:
            category.display_order = data["display_order"]
        if "is_active" in data:
            category.is_active = data["is_active"]

        category.save()

        # Handle Treebeard Re-parenting
        if "parent_id" in data:
            new_parent_id = data["parent_id"]
            if new_parent_id:
                new_parent = get_object_or_404(Category, id=new_parent_id)
                # Ensure we don't move a category under itself or its descendants
                if not new_parent.is_descendant_of(category) and new_parent.id != category.id:
                    category.move(new_parent, pos="last-child")
                    category.refresh_from_db()
            else:
                # Move to root
                if not category.is_root():
                    category.move(Category.get_first_root_node(), pos="last-sibling")
                    category.refresh_from_db()

        TaxonomyService.invalidate_cache()
        return Response(CategoryDetailSerializer(category).data, status=status.HTTP_200_OK)


class AdminAttributeListCreateAPIView(APIView):
    """Admin CRUD for global dynamic attributes."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        attrs = Attribute.objects.prefetch_related("values").all()
        serializer = AttributeSerializer(attrs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AttributeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attr = serializer.save()
        return Response(AttributeSerializer(attr).data, status=status.HTTP_201_CREATED)


class AdminAttributeUpdateAPIView(APIView):
    """Admin CRUD for global dynamic attributes."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, pk):
        attr = get_object_or_404(Attribute, pk=pk)
        
        if "name" in request.data:
            attr.name = request.data["name"]
        if "name_am" in request.data:
            attr.name_am = request.data["name_am"]
        if "unit" in request.data:
            attr.unit = request.data["unit"]
            
        attr.save()
        return Response(AttributeSerializer(attr).data, status=status.HTTP_200_OK)


class AdminAttributeValueCreateAPIView(APIView):
    """Adds standardized values to an attribute or deletes existing values."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        attr = get_object_or_404(Attribute, pk=pk)
        value = request.data.get("value")
        if not value:
            return Response({"error": "Value is required."}, status=status.HTTP_400_BAD_REQUEST)

        value_str = value.strip()
        val = AttributeValue.all_objects.filter(attribute=attr, value__iexact=value_str).first()
        if val:
            if val.is_deleted:
                val.restore()
            val.value = value_str
            val.value_am = request.data.get("value_am", "").strip()
            val.color_code = request.data.get("color_code", "").strip()
            val.save()
        else:
            val = AttributeValue.objects.create(
                attribute=attr,
                value=value_str,
                value_am=request.data.get("value_am", "").strip(),
                color_code=request.data.get("color_code", "").strip()
            )
        return Response(AttributeValueSerializer(val).data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk, val_id=None):
        attr = get_object_or_404(Attribute, pk=pk)
        target_val_id = val_id or request.data.get("value_id")
        val = get_object_or_404(AttributeValue, attribute=attr, pk=target_val_id)
        val.delete()
        return Response({"message": "Attribute value deleted successfully."}, status=status.HTTP_200_OK)


class AdminCategoryAttributeBindAPIView(APIView):
    """Binds an attribute to a category or unbinds it."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategoryAttributeBindSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        attr = get_object_or_404(Attribute, id=data["attribute_id"])
        
        # Check if a soft-deleted binding exists
        binding = CategoryAttribute.all_objects.filter(category=category, attribute=attr).first()
        try:
            if binding:
                if binding.is_deleted:
                    binding.restore()
                binding.is_required = data.get("is_required", False)
                binding.is_variant_creator = data.get("is_variant_creator", False)
                binding.is_filterable = data.get("is_filterable", True)
                binding.display_order = data.get("display_order", 0)
                binding.save()
            else:
                binding = CategoryAttribute.objects.create(
                    category=category,
                    attribute=attr,
                    is_required=data.get("is_required", False),
                    is_variant_creator=data.get("is_variant_creator", False),
                    is_filterable=data.get("is_filterable", True),
                    display_order=data.get("display_order", 0),
                )
        except IntegrityError:
            return Response(
                {"error": f"The attribute '{attr.name}' is already bound to the '{category.name}' category."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return Response(CategoryAttributeSerializer(binding).data, status=status.HTTP_200_OK)

    def delete(self, request, pk, attr_id):
        category = get_object_or_404(Category, pk=pk)
        binding = get_object_or_404(CategoryAttribute, category=category, attribute_id=attr_id)
        binding.delete()
        return Response({"message": "Attribute unbound from category."}, status=status.HTTP_200_OK)


class AdminCategoryAttributeListAPIView(APIView):
    """Lists all category attribute bindings for the matrix table."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        qs = CategoryAttribute.objects.all().select_related("category", "attribute")
        serializer = AdminCategoryAttributeSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminCategoryAttributeDeleteAPIView(APIView):
    """Unbinds an attribute from a category by the binding ID."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, pk):
        binding = get_object_or_404(CategoryAttribute, pk=pk)
        binding.delete()
        return Response({"message": "Attribute unbound successfully."}, status=status.HTTP_200_OK)


class AdminBrandListCreateAPIView(APIView):
    """Admin Brand management (CRUD)."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        brands = Brand.objects.all().prefetch_related("categories")
        serializer = BrandSerializer(brands, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BrandSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        brand = serializer.save(is_verified=True)

        # Handle category_ids from either JSON list, or comma-delimited string (multipart)
        raw_ids = request.data.get("category_ids", "")
        if isinstance(raw_ids, list):
            cat_ids = [str(i).strip() for i in raw_ids if i]
        elif isinstance(raw_ids, str) and raw_ids.strip():
            cat_ids = [c.strip() for c in raw_ids.split(",") if c.strip()]
        else:
            cat_ids = []
        if cat_ids:
            brand.categories.set(cat_ids)

        return Response(BrandSerializer(brand).data, status=status.HTTP_201_CREATED)


class AdminBrandDetailAPIView(APIView):
    """Admin Brand update and delete."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        return get_object_or_404(Brand, pk=pk)

    def put(self, request, pk):
        brand = self.get_object(pk)
        serializer = BrandSerializer(brand, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        brand = serializer.save()

        # Handle category_ids from either JSON list or comma-delimited string
        raw_ids = request.data.get("category_ids")
        if raw_ids is not None:
            if isinstance(raw_ids, list):
                cat_ids = [str(i).strip() for i in raw_ids if i]
            elif isinstance(raw_ids, str) and raw_ids.strip():
                cat_ids = [c.strip() for c in raw_ids.split(",") if c.strip()]
            else:
                cat_ids = []
            brand.categories.set(cat_ids)

        return Response(BrandSerializer(brand).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        brand = self.get_object(pk)
        brand.delete()
        return Response({"message": "Brand deleted successfully."}, status=status.HTTP_200_OK)



from rest_framework import generics

class AdminProductModerationListAPIView(generics.ListAPIView):
    """Admin moderation queue listing products with pagination."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = ProductListSerializer

    def get_queryset(self):
        params = getattr(self.request, "query_params", getattr(self.request, "GET", {}))
        status_param = params.get("status")
        qs = Product.objects.all().select_related("vendor", "category", "brand").prefetch_related("images", "variants", "variants__warehouse_stocks")
        
        # Status filtering: only filter if specific status is requested and not 'ALL'
        if status_param and str(status_param).strip().upper() not in ["", "ALL", "NONE", "NULL"]:
            qs = qs.filter(status=status_param.strip().upper())
        
        # Category filtering: matches selected category and all its descendant subcategories
        category_param = params.get("category")
        if category_param and str(category_param).strip().upper() not in ["", "ALL", "NONE", "NULL"]:
            category_param = category_param.strip()
            from apps.catalog.models import Category
            cat_obj = None
            try:
                import uuid
                cat_obj = Category.objects.filter(id=uuid.UUID(str(category_param))).first()
            except (ValueError, AttributeError):
                cat_obj = Category.objects.filter(slug=category_param).first()

            if cat_obj:
                descendants_and_self = list(cat_obj.get_descendants().values_list("id", flat=True)) + [cat_obj.id]
                qs = qs.filter(category_id__in=descendants_and_self)
            else:
                qs = qs.filter(category__slug=category_param)

        # Multi-field search
        search = params.get("search")
        if search and search.strip():
            search = search.strip()
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(vendor__store_name__icontains=search) |
                Q(vendor__user__phone_number__icontains=search) |
                Q(variants__sku__icontains=search) |
                Q(category__name__icontains=search)
            ).distinct()
            
        return qs.order_by("-created_at")


class AdminProductDetailAPIView(APIView):
    """Admin view for product details."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        return Response(ProductDetailSerializer(product).data, status=status.HTTP_200_OK)



class AdminProductApproveAPIView(APIView):
    """Approves a product from the moderation queue."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        approved = ProductApprovalService.admin_approve(product, request.user)
        return Response(ProductDetailSerializer(approved).data, status=status.HTTP_200_OK)


class AdminProductRejectAPIView(APIView):
    """Rejects a product from the moderation queue with a mandatory reason."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        serializer = ProductRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data["reason"]

        rejected = ProductApprovalService.admin_reject(product, request.user, reason)
        return Response(ProductDetailSerializer(rejected).data, status=status.HTTP_200_OK)


class AdminProductCountsAPIView(APIView):
    """
    Returns per-status product counts using a single aggregated SQL query.
    Replaces the 4 separate SWR calls on the admin moderation KPI deck.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        counts = Product.objects.aggregate(
            total=Count("id"),
            pending=Count("id", filter=Q(status=ProductStatus.PENDING_REVIEW)),
            active=Count("id", filter=Q(status=ProductStatus.ACTIVE)),
            rejected=Count("id", filter=Q(status=ProductStatus.REJECTED)),
            draft=Count("id", filter=Q(status=ProductStatus.DRAFT)),
        )
        return Response(counts, status=status.HTTP_200_OK)
