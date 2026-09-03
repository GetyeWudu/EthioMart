"""
apps/vendors/views.py
======================
API views for the vendors domain, organized into three access layers:

  A. Seller Self-Service (/api/v1/vendors/me/)
  B. Public Storefront (/api/v1/vendors/)
  C. Admin Moderation (/api/v1/admin/vendors/)
"""

import logging
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsSeller, IsAnyAdmin, IsSuperAdmin, IsVendorOwner
from .models import VendorProfile, KYCDocument, VendorBankDetails, VendorWallet, VendorLedgerEntry, PayoutRequest
from .serializers import (
    SellerProfileSerializer,
    SellerProfileUpdateSerializer,
    SellerKYCSubmitSerializer,
    VendorBankDetailsSerializer,
    VendorBankDetailsWriteSerializer,
    KYCDocumentSerializer,
    KYCDocumentUploadSerializer,
    VendorWalletSerializer,
    VendorLedgerEntrySerializer,
    PayoutRequestSerializer,
    VendorWithdrawalRequestSerializer,
    PublicStoreSerializer,
    AdminVendorListSerializer,
    AdminVendorDetailSerializer,
    AdminRejectSerializer,
    AdminSuspendSerializer,
    AdminCommissionSerializer,
)
from .services import VendorService, KYCVerificationService, WalletService

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# A. SELLER SELF-SERVICE
# ─────────────────────────────────────────────────────────────────────────────

class SellerProfileView(APIView):
    """
    GET  /api/v1/vendors/me/   — Retrieve own vendor profile
    PATCH /api/v1/vendors/me/  — Update branding / contact / location fields
    """

    permission_classes = [IsAuthenticated, IsSeller]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_vendor(self, request):
        return VendorService.get_or_create_profile(request.user)

    def get(self, request):
        vendor = self._get_vendor(request)
        serializer = SellerProfileSerializer(vendor, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        vendor = self._get_vendor(request)
        serializer = SellerProfileUpdateSerializer(
            vendor, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        updated_vendor = VendorService.update_profile(vendor, serializer.validated_data)
        return Response(SellerProfileSerializer(updated_vendor, context={"request": request}).data)


class SellerWalletView(APIView):
    """
    GET /api/v1/vendors/me/wallet/  — Retrieve wallet balance snapshot
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def get(self, request):
        from datetime import timedelta
        from django.utils import timezone
        from apps.orders.models import VendorSubOrder

        vendor = VendorService.get_or_create_profile(request.user)

        # Check and settle any sub-orders delivered over 5 minutes ago
        clearance_cutoff = timezone.now() - timedelta(minutes=5)
        eligible_sub_orders = VendorSubOrder.objects.filter(
            vendor=vendor,
            delivered_at__isnull=False,
            delivered_at__lte=clearance_cutoff,
            is_payout_settled=False,
            is_disputed=False,
        )
        for so in eligible_sub_orders:
            WalletService.settle_payout(so)

        summary = WalletService.get_balance_summary(vendor)
        return Response(summary)


class SellerLedgerListView(APIView):
    """
    GET /api/v1/vendors/me/ledger/  — Retrieve immutable financial ledger entries
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        wallet = WalletService.get_or_create_wallet(vendor)
        entries = VendorLedgerEntry.objects.filter(wallet=wallet).order_by("-created_at")
        serializer = VendorLedgerEntrySerializer(entries, many=True)
        return Response(serializer.data)


class SellerWithdrawalView(APIView):
    """
    POST /api/v1/vendors/me/wallet/withdraw/ — Request automated payout withdrawal via Chapa Transfer API
    """
    permission_classes = [IsAuthenticated, IsVendorOwner]

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        serializer = VendorWithdrawalRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = WalletService.request_withdrawal(
            vendor=vendor,
            requested_amount=data["amount"],
            bank_code=data.get("bank_code"),
            account_number=data.get("account_number"),
            account_name=data.get("account_name"),
            bank_name=data.get("bank_name"),
        )
        return Response(result, status=status.HTTP_200_OK)


class SellerPayoutRequestListView(APIView):
    """
    GET /api/v1/vendors/me/payouts/ — List all historical and in-flight payout requests
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        payouts = PayoutRequest.objects.filter(vendor=vendor).order_by("-created_at")
        serializer = PayoutRequestSerializer(payouts, many=True)
        return Response(serializer.data)


class SellerKYCSubmitView(APIView):
    """
    POST /api/v1/vendors/me/kyc/
    Validates documents and transitions DRAFT/REJECTED → PENDING_REVIEW.
    """
    permission_classes = [IsAuthenticated, IsVendorOwner]

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        serializer = SellerKYCSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_vendor = KYCVerificationService.submit_for_review(vendor, serializer.validated_data)
        return Response(
            SellerProfileSerializer(updated_vendor, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class SellerBankDetailsView(APIView):
    """
    GET  /api/v1/vendors/me/bank/   — Retrieve own bank details
    POST /api/v1/vendors/me/bank/   — Create or update bank details
    """
    permission_classes = [IsAuthenticated, IsVendorOwner]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        if hasattr(vendor, "bank_details"):
            return Response(VendorBankDetailsSerializer(vendor.bank_details, context={"request": request}).data)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        serializer = VendorBankDetailsWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bank_details, created = VendorBankDetails.objects.update_or_create(
            vendor=vendor,
            defaults=serializer.validated_data,
        )
        return Response(
            VendorBankDetailsSerializer(bank_details, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class SellerDocumentListView(APIView):
    """
    POST /api/v1/vendors/me/documents/  — Upload a new KYC document (multipart/form-data)
    GET  /api/v1/vendors/me/documents/  — List all uploaded KYC documents
    """
    permission_classes = [IsAuthenticated, IsVendorOwner]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        docs = vendor.kyc_documents.all()
        serializer = KYCDocumentSerializer(docs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        serializer = KYCDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doc = KYCDocument.objects.create(vendor=vendor, **serializer.validated_data)
        return Response(
            KYCDocumentSerializer(doc, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SellerDocumentDetailView(APIView):
    """
    DELETE /api/v1/vendors/me/documents/<doc_id>/
    Sellers may only delete unverified documents.
    """
    permission_classes = [IsAuthenticated, IsVendorOwner]

    def delete(self, request, doc_id):
        vendor = VendorService.get_or_create_profile(request.user)
        doc = get_object_or_404(KYCDocument, id=doc_id, vendor=vendor)
        if doc.is_verified:
            return Response(
                {"detail": "Verified documents cannot be deleted."},
                status=status.HTTP_403_FORBIDDEN,
            )
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SellerStaffListCreateAPIView(APIView):
    """
    GET  /api/v1/vendors/staff/ — List all staff
    POST /api/v1/vendors/staff/ — Invite/create staff member by email
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def get(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        from apps.vendors.models import VendorStaff
        from apps.vendors.serializers import VendorStaffSerializer
        staff = VendorStaff.objects.filter(vendor=vendor).select_related("user", "assigned_facility")
        return Response(VendorStaffSerializer(staff, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        vendor = VendorService.get_or_create_profile(request.user)
        email = request.data.get("email")
        role = request.data.get("role", "INVENTORY_CLERK")
        assigned_wh_id = request.data.get("assigned_facility_id")

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce Hierarchical RBAC: Managers cannot invite Owners or Managers
        staff_record = request.user.vendor_staff_roles.filter(is_active=True).first()
        is_owner = bool(staff_record and staff_record.role == "OWNER")
        if not is_owner and role in ["OWNER", "MANAGER"]:
            return Response({"error": "Only Store Owners can invite Managers or other Owners."}, status=status.HTTP_403_FORBIDDEN)

        from apps.users.models import CustomUser
        from apps.inventory.models import WarehouseLocation
        from apps.vendors.models import VendorStaff, VendorStaffInvitation
        from apps.vendors.serializers import VendorStaffSerializer

        warehouse = None
        if assigned_wh_id:
            warehouse = get_object_or_404(WarehouseLocation, id=assigned_wh_id, vendor=vendor)

        invitation, created = VendorStaffInvitation.objects.update_or_create(
            vendor=vendor,
            email=email,
            defaults={
                "role": role,
                "assigned_facility": warehouse,
                "is_accepted": False
            }
        )

        from apps.vendors.services.invitation_service import InvitationService
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            InvitationService.send_staff_invitation_email(invitation)
        except Exception as e:
            logger.error(f"Failed to send invitation email to {email}: {e}")
            return Response({"error": "Failed to send invitation email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Invitation sent successfully",
            "email": email,
            "role": role
        }, status=status.HTTP_201_CREATED)


class SellerStaffInviteDetailsAPIView(APIView):
    """
    GET /api/v1/vendors/staff/invite-details/?token=<token>
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")
        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        from apps.vendors.models import VendorStaffInvitation
        invitation = get_object_or_404(VendorStaffInvitation, token=token)

        if invitation.is_accepted:
            return Response({"error": "Invitation has already been accepted"}, status=status.HTTP_400_BAD_REQUEST)
        if invitation.is_expired():
            return Response({"error": "Invitation has expired"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "vendor_name": invitation.vendor.store_name,
            "email": invitation.email,
            "role": invitation.get_role_display(),
            "assigned_facility_name": invitation.assigned_facility.name if invitation.assigned_facility else "All Facilities"
        }, status=status.HTTP_200_OK)


class SellerStaffAcceptInviteAPIView(APIView):
    """
    POST /api/v1/vendors/staff/accept-invite/
    Payload: { "token": "...", "password": "...", "first_name": "...", "last_name": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        password = request.data.get("password")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")

        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)

        from apps.vendors.models import VendorStaffInvitation, VendorStaff
        from apps.users.models import CustomUser
        from rest_framework_simplejwt.tokens import RefreshToken

        invitation = get_object_or_404(VendorStaffInvitation, token=token)
        
        if invitation.is_accepted:
            return Response({"error": "Invitation already accepted"}, status=status.HTTP_400_BAD_REQUEST)
        if invitation.is_expired():
            return Response({"error": "Invitation has expired"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        user = CustomUser.objects.filter(email=invitation.email).first()
        if not user:
            if not password:
                return Response({"error": "Password is required for new accounts"}, status=status.HTTP_400_BAD_REQUEST)
            user = CustomUser.objects.create_user(
                email=invitation.email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                role="SELLER"
            )
        else:
            # Make sure existing user is seller role
            if user.role != "SELLER":
                user.role = "SELLER"
                user.save()

        # Provision VendorStaff
        VendorStaff.objects.update_or_create(
            vendor=invitation.vendor,
            user=user,
            defaults={
                "role": invitation.role,
                "assigned_facility": invitation.assigned_facility,
                "is_active": True,
            }
        )

        invitation.is_accepted = True
        invitation.save()

        # Generate JWT
        from apps.users.tokens import CustomTokenObtainPairSerializer
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "vendor_staff_role": invitation.role,
                "assigned_facility_id": str(invitation.assigned_facility_id) if invitation.assigned_facility_id else None
            }
        }, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# B. PUBLIC STOREFRONT
# ─────────────────────────────────────────────────────────────────────────────

class PublicStoreListView(APIView):
    """
    GET /api/v1/vendors/   — Paginated list of approved public stores
    Query params: ?search=<name>
    """
    permission_classes = [AllowAny]

    def get(self, request):
        search    = request.query_params.get("search", "")
        page_size = min(int(request.query_params.get("page_size", 20)), 100)
        stores    = VendorService.list_approved_stores(search=search, page_size=page_size)
        serializer = PublicStoreSerializer(stores, many=True, context={"request": request})
        return Response({"count": stores.count(), "results": serializer.data})


class PublicStoreDetailView(APIView):
    """
    GET /api/v1/vendors/<slug>/  — Public store detail (404 if not APPROVED)
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        vendor = VendorService.get_public_store(slug)
        serializer = PublicStoreSerializer(vendor, context={"request": request})
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# C. ADMIN MODERATION
# ─────────────────────────────────────────────────────────────────────────────

class AdminVendorListView(APIView):
    """
    GET /api/v1/admin/vendors/
    Filterable by: ?status=&vendor_type=&tier=&search=
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        qs = VendorProfile.objects.select_related("user", "wallet").order_by("-created_at")

        status_filter      = request.query_params.get("status")
        vendor_type_filter = request.query_params.get("vendor_type")
        tier_filter        = request.query_params.get("tier")
        search             = request.query_params.get("search")

        if status_filter:
            qs = qs.filter(status=status_filter)
        if vendor_type_filter:
            qs = qs.filter(vendor_type=vendor_type_filter)
        if tier_filter:
            qs = qs.filter(tier=tier_filter)
        if search:
            qs = qs.filter(store_name__icontains=search)

        serializer = AdminVendorListSerializer(qs, many=True, context={"request": request})
        return Response({"count": qs.count(), "results": serializer.data})


class AdminVendorDetailView(APIView):
    """
    GET /api/v1/admin/vendors/<vendor_id>/
    Full detail: KYC docs, bank info, wallet, user info, audit trail.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request, vendor_id):
        vendor = get_object_or_404(
            VendorProfile.objects.select_related("user", "bank_details", "wallet", "verified_by")
            .prefetch_related("kyc_documents"),
            id=vendor_id,
        )
        serializer = AdminVendorDetailSerializer(vendor, context={"request": request})
        return Response(serializer.data)


class AdminVendorApproveView(APIView):
    """
    POST /api/v1/admin/vendors/<vendor_id>/approve/
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, vendor_id):
        vendor = get_object_or_404(VendorProfile, id=vendor_id)
        updated_vendor = KYCVerificationService.approve_vendor(actor=request.user, vendor=vendor)
        return Response(
            AdminVendorDetailSerializer(updated_vendor, context={"request": request}).data
        )


class AdminVendorRejectView(APIView):
    """
    POST /api/v1/admin/vendors/<vendor_id>/reject/
    Body: {"reason": "..."}
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, vendor_id):
        vendor = get_object_or_404(VendorProfile, id=vendor_id)
        serializer = AdminRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_vendor = KYCVerificationService.reject_vendor(
            actor=request.user,
            vendor=vendor,
            reason=serializer.validated_data["reason"],
        )
        return Response(
            AdminVendorDetailSerializer(updated_vendor, context={"request": request}).data
        )


class AdminVendorSuspendView(APIView):
    """
    POST /api/v1/admin/vendors/<vendor_id>/suspend/
    Body: {"reason": "..."}
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, vendor_id):
        vendor = get_object_or_404(
            VendorProfile.objects.select_related("wallet"), id=vendor_id
        )
        serializer = AdminSuspendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_vendor = KYCVerificationService.suspend_vendor(
            actor=request.user,
            vendor=vendor,
            reason=serializer.validated_data["reason"],
        )
        return Response(
            AdminVendorDetailSerializer(updated_vendor, context={"request": request}).data
        )


class AdminVendorReactivateView(APIView):
    """
    POST /api/v1/admin/vendors/<vendor_id>/reactivate/
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, vendor_id):
        vendor = get_object_or_404(
            VendorProfile.objects.select_related("wallet"), id=vendor_id
        )
        updated_vendor = KYCVerificationService.reactivate_vendor(actor=request.user, vendor=vendor)
        return Response(
            AdminVendorDetailSerializer(updated_vendor, context={"request": request}).data
        )


class AdminVendorCommissionView(APIView):
    """
    PATCH /api/v1/admin/vendors/<vendor_id>/commission/
    Super Admin ONLY. Body: {"commission_rate": "8.50"}
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, vendor_id):
        vendor = get_object_or_404(VendorProfile, id=vendor_id)
        serializer = AdminCommissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_vendor = KYCVerificationService.update_commission_rate(
            actor=request.user,
            vendor=vendor,
            new_rate=serializer.validated_data["commission_rate"],
        )
        return Response(
            AdminVendorDetailSerializer(updated_vendor, context={"request": request}).data
        )


class AdminVendorRetryChapаView(APIView):
    """
    POST /api/v1/admin/vendors/<vendor_id>/retry-chapa/
    Manual trigger for Chapa subaccount provisioning retry.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, vendor_id):
        vendor = get_object_or_404(VendorProfile, id=vendor_id)
        try:
            from apps.vendors.tasks import provision_chapa_subaccount
            provision_chapa_subaccount.apply_async(args=[str(vendor.id)], countdown=0)
            return Response(
                {"detail": f"Chapa provisioning task queued for '{vendor.store_name}'."},
                status=status.HTTP_202_ACCEPTED,
            )
        except Exception as e:
            logger.error(f"Failed to queue Chapa retry for vendor {vendor_id}: {e}")
            return Response(
                {"detail": "Celery is not available. Chapa provisioning must be retried when workers are online."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class SellerStaffDetailAPIView(APIView):
    """
    DELETE /api/v1/vendors/staff/<id>/ — Revoke access
    PATCH /api/v1/vendors/staff/<id>/ — Update role/warehouse
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def delete(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        from apps.vendors.models import VendorStaff
        staff_to_delete = get_object_or_404(VendorStaff, id=pk, vendor=vendor)

        # Enforce Hierarchical RBAC: Non-owners cannot delete OWNERs
        req_staff = request.user.vendor_staff_roles.filter(is_active=True).first()
        is_owner = bool(req_staff and req_staff.role == "OWNER")
        
        if staff_to_delete.role == "OWNER" and not is_owner:
            return Response({"error": "Only Store Owners can revoke Owner access."}, status=status.HTTP_403_FORBIDDEN)
            
        staff_to_delete.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        vendor = VendorService.get_or_create_profile(request.user)
        from apps.vendors.models import VendorStaff
        staff_to_update = get_object_or_404(VendorStaff, id=pk, vendor=vendor)

        req_staff = request.user.vendor_staff_roles.filter(is_active=True).first()
        is_owner = bool(req_staff and req_staff.role == "OWNER")

        # Non-owners cannot modify an OWNER record
        if staff_to_update.role == "OWNER" and not is_owner:
            return Response({"error": "Only Store Owners can modify an Owner's record."}, status=status.HTTP_403_FORBIDDEN)

        role = request.data.get("role")
        assigned_wh_id = request.data.get("assigned_facility_id")

        if role:
            # Non-owners cannot grant OWNER or MANAGER roles
            if not is_owner and role in ["OWNER", "MANAGER"]:
                return Response({"error": "Only Store Owners can promote to Manager or Owner."}, status=status.HTTP_403_FORBIDDEN)
            staff_to_update.role = role

        if assigned_wh_id is not None:
            if assigned_wh_id == "":
                staff_to_update.assigned_facility = None
            else:
                from apps.inventory.models import WarehouseLocation
                warehouse = get_object_or_404(WarehouseLocation, id=assigned_wh_id, vendor=vendor)
                staff_to_update.assigned_facility = warehouse

        staff_to_update.save()
        
        from apps.vendors.serializers import VendorStaffSerializer
        return Response(VendorStaffSerializer(staff_to_update).data, status=status.HTTP_200_OK)


class AdminCommissionsListView(APIView):
    """
    GET /api/v1/admin/commissions/
    Returns live platform commission splits and seller payouts.
    Platform VAT is N/A — GechExpress is not yet VAT-registered.
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get(self, request):
        entries = VendorLedgerEntry.objects.filter(
            entry_type=VendorLedgerEntry.EntryType.ESCROW_CREDIT
        ).select_related('wallet__vendor', 'sub_order__order').order_by('-created_at')[:100]

        total_gross_commissions = Decimal('0.00')
        total_seller_vat_advisory = Decimal('0.00')
        total_seller_payouts = Decimal('0.00')

        records = []
        for entry in entries:
            vendor = entry.wallet.vendor
            sub_order = entry.sub_order
            order = sub_order.order if sub_order else None

            gross_total = entry.amount or Decimal('0.00')
            comm_gross = entry.commission_deducted or Decimal('0.00')
            seller_vat = entry.seller_vat_advisory or Decimal('0.00')
            v_payout = entry.net_amount or Decimal('0.00')

            total_gross_commissions += comm_gross
            total_seller_vat_advisory += seller_vat
            total_seller_payouts += v_payout

            is_settled = bool(sub_order and sub_order.is_payout_settled)
            tax_regime_label = "VAT Registered" if entry.is_vat_registered_vendor else "TOT / Non-VAT"

            records.append({
                "id": f"COM-{str(entry.id)[:8].upper()}",
                "uuid": str(entry.id),
                "seller": vendor.store_name,
                "seller_id": str(vendor.id),
                "seller_tin": vendor.tin_number or "N/A",
                "seller_tax_regime": tax_regime_label,
                "order_id": order.order_number if order else "N/A",
                "order_uuid": str(order.id) if order else None,
                "sub_order_id": f"SUB-{str(sub_order.id)[:8].upper()}" if sub_order else "N/A",
                "amount": float(gross_total),
                "commission_rate": float(entry.commission_rate or 10.0),
                "fee": float(comm_gross),
                "fee_net": float(comm_gross),  # Platform not VAT-registered; net = gross fee
                "platform_vat": 0.0,           # Always 0 — GechExpress not VAT-registered
                "seller_vat_advisory": float(seller_vat),
                "is_vat_registered_vendor": entry.is_vat_registered_vendor,
                "netPayout": float(v_payout),
                "status": "Paid" if is_settled else "Pending",
                "escrow_state": "Settled" if is_settled else "Held",
                "date": entry.created_at.strftime("%d %b %Y, %H:%M"),
            })

        return Response({
            "success": True,
            "currency": "ETB",
            "kpis": {
                "total_gross_commissions": float(total_gross_commissions),
                "total_net_commissions": float(total_gross_commissions),  # Net = Gross (no platform VAT)
                "total_vat_liability": float(total_seller_vat_advisory),  # Repurposed: seller VAT advisory sum
                "total_seller_payouts": float(total_seller_payouts),
                "total_records": len(records),
            },
            "records": records,
        })


class SellerAnalyticsOverviewView(APIView):
    """
    GET /api/v1/vendors/me/analytics/?range=30d
    Returns real-time financial metrics, ETB sales trajectory, operational queues, and SKU performance for this vendor.
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def _get_vendor(self, request):
        return VendorService.get_or_create_profile(request.user)

    def get(self, request):
        vendor = self._get_vendor(request)
        wallet, _ = VendorWallet.objects.get_or_create(vendor=vendor)
        time_range = request.query_params.get("range", "30d")

        days_lookup = {"7d": 7, "30d": 30, "90d": 90, "12m": 365}
        days = days_lookup.get(time_range, 30)
        start_date = timezone.now() - timedelta(days=days)

        from apps.orders.models import VendorSubOrder, OrderPaymentStatus
        from apps.inventory.models import WarehouseStock

        sub_orders = VendorSubOrder.objects.filter(vendor=vendor)
        paid_sub_orders = sub_orders.filter(order__payment_status=OrderPaymentStatus.PAID)
        range_paid_sub_orders = paid_sub_orders.filter(created_at__gte=start_date)

        total_gross_gmv = paid_sub_orders.aggregate(total=Sum("sub_total"))["total"] or Decimal("0.00")
        range_gross_gmv = range_paid_sub_orders.aggregate(total=Sum("sub_total"))["total"] or Decimal("0.00")

        comm_rate = vendor.commission_rate or Decimal("10.00")
        comm_factor = Decimal(str(comm_rate)) / Decimal("100.00")
        range_net_earnings = range_gross_gmv * (Decimal("1.00") - comm_factor)
        total_net_earnings = total_gross_gmv * (Decimal("1.00") - comm_factor)

        active_orders_count = sub_orders.filter(dispatched_at__isnull=True).count()
        dispatched_orders_count = sub_orders.filter(dispatched_at__isnull=False, delivered_at__isnull=True).count()
        delivered_orders_count = sub_orders.filter(delivered_at__isnull=False).count()

        total_units_sold = 0
        for so in paid_sub_orders:
            for item in so.items.all():
                total_units_sold += item.quantity

        timeline = []
        step_days = max(1, days // 12)
        now = timezone.now()
        for i in range(12):
            interval_end = now - timedelta(days=(11 - i) * step_days)
            interval_start = interval_end - timedelta(days=step_days)
            slice_so = paid_sub_orders.filter(created_at__gte=interval_start, created_at__lt=interval_end)
            slice_gmv = slice_so.aggregate(total=Sum("sub_total"))["total"] or Decimal("0.00")
            slice_net = Decimal(str(slice_gmv)) * (Decimal("1.00") - comm_factor)
            label = interval_end.strftime("%d %b" if days <= 30 else "%b %Y")
            timeline.append({
                "date": label,
                "gmv": float(slice_gmv),
                "net": float(slice_net),
                "orders": slice_so.count(),
            })

        low_stock_count = WarehouseStock.objects.filter(
            warehouse__vendor=vendor,
            quantity_on_hand__lte=5
        ).count()

        recent_orders = []
        for so in sub_orders.order_by("-created_at")[:5]:
            recent_orders.append({
                "id": str(so.id),
                "order_number": so.order.order_number,
                "date": so.created_at.strftime("%d %b, %H:%M"),
                "total_amount": float(so.sub_total),
                "status": so.derived_status,
                "is_payout_settled": so.is_payout_settled,
                "items_count": so.items.count(),
                "customer_name": f"{so.order.customer.first_name} {so.order.customer.last_name}".strip() if so.order.customer and (so.order.customer.first_name or so.order.customer.last_name) else "Customer",
            })

        return Response({
            "success": True,
            "currency": "ETB",
            "kpis": {
                "available_balance": float(wallet.available_balance),
                "escrow_balance": float(wallet.pending_balance),
                "total_withdrawn": float(wallet.total_withdrawn),
                "range_gross_gmv": float(range_gross_gmv),
                "range_net_earnings": float(range_net_earnings),
                "total_gross_gmv": float(total_gross_gmv),
                "total_net_earnings": float(total_net_earnings),
                "active_orders": active_orders_count,
                "dispatched_orders": dispatched_orders_count,
                "delivered_orders": delivered_orders_count,
                "units_sold": total_units_sold,
                "low_stock_count": low_stock_count,
            },
            "timeline": timeline,
            "recent_orders": recent_orders,
        })

