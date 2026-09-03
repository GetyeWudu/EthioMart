"""
apps/disputes/views.py
======================
REST API endpoints for Customer claims, Seller 1-click approvals,
and Admin dispute arbitration.
"""

from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404

from apps.disputes.models import Dispute
from apps.disputes.serializers import DisputeSerializer, DisputeCreateSerializer
from apps.disputes.services import DisputeService
from apps.orders.models import VendorSubOrder
from apps.common.permissions import IsSeller, IsAnyAdmin


class CustomerDisputeCreateView(APIView):
    """
    POST /api/v1/orders/{sub_order_id}/dispute/
    Allows customer to open a dispute claim on a delivered sub-order within 48h.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, sub_order_id):
        if not request.user.is_active:
            raise PermissionDenied("Your account is suspended. Opening new dispute claims is disabled.")

        sub_order = get_object_or_404(
            VendorSubOrder.objects.select_related('order', 'vendor'),
            id=sub_order_id,
            order__customer=request.user
        )

        serializer = DisputeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        dispute = DisputeService.open_dispute(
            sub_order=sub_order,
            customer=request.user,
            reason=serializer.validated_data['reason'],
            notes=serializer.validated_data['customer_notes'],
            evidence_images=serializer.validated_data.get('evidence_images', [])
        )

        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)


class CustomerDisputeListView(generics.ListAPIView):
    """
    GET /api/v1/customer/disputes/
    Lists all disputes filed by current authenticated customer.
    """
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Dispute.objects.filter(customer=self.request.user).select_related(
            'sub_order__order', 'vendor', 'customer'
        ).prefetch_related('sub_order__items__variant__product')


class SellerDisputeListView(generics.ListAPIView):
    """
    GET /api/v1/seller/disputes/
    Lists disputes opened against the authenticated vendor.
    """
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated, IsSeller]

    def get_queryset(self):
        vendor_profile = getattr(self.request.user, 'vendor_profile', None)
        if not vendor_profile:
            return Dispute.objects.none()
        return Dispute.objects.filter(vendor=vendor_profile).select_related(
            'sub_order__order', 'vendor', 'customer'
        ).prefetch_related('sub_order__items__variant__product')


class SellerDisputeAcceptView(APIView):
    """
    POST /api/v1/seller/disputes/{id}/accept/
    Allows a seller to 1-click accept a customer return claim and authorize refund.
    """
    permission_classes = [IsAuthenticated, IsSeller]

    def post(self, request, pk):
        vendor_profile = getattr(request.user, 'vendor_profile', None)
        if not vendor_profile:
            raise PermissionDenied("Only verified merchants can access this endpoint.")

        dispute = get_object_or_404(Dispute, id=pk, vendor=vendor_profile)
        notes = request.data.get('notes', 'Seller accepted return claim.')

        resolved_dispute = DisputeService.resolve_dispute(
            dispute=dispute,
            action='REFUND_BUYER',
            admin_notes=f"Seller Authorized Refund: {notes}",
            resolved_by=request.user
        )

        return Response({
            "success": True,
            "message": "Return claim accepted. Escrow has been refunded to customer.",
            "data": DisputeSerializer(resolved_dispute).data
        })


class AdminDisputeListView(generics.ListAPIView):
    """
    GET /api/v1/admin/disputes/
    Super Admin & Operational Admin view to inspect and arbitrate all platform disputes.
    """
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def get_queryset(self):
        qs = Dispute.objects.all().select_related(
            'sub_order__order', 'vendor', 'customer', 'resolved_by'
        ).prefetch_related('sub_order__items__variant__product')

        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'ALL':
            qs = qs.filter(status=status_param)

        return qs


class AdminDisputeResolutionView(APIView):
    """
    POST /api/v1/admin/disputes/{id}/resolve/
    Payload: { "action": "REFUND_BUYER" | "REJECT_CLAIM", "admin_notes": "..." }
    """
    permission_classes = [IsAuthenticated, IsAnyAdmin]

    def post(self, request, pk):
        dispute = get_object_or_404(
            Dispute.objects.select_related('sub_order__order', 'vendor'),
            id=pk
        )
        action = request.data.get('action') or request.data.get('resolution')
        admin_notes = request.data.get('admin_notes', '')

        if action == 'BUYER':
            action = 'REFUND_BUYER'
        elif action == 'SELLER':
            action = 'REJECT_CLAIM'

        resolved_dispute = DisputeService.resolve_dispute(
            dispute=dispute,
            action=action,
            admin_notes=admin_notes,
            resolved_by=request.user
        )

        return Response({
            "success": True,
            "message": f"Dispute resolved with decision: {action}",
            "data": DisputeSerializer(resolved_dispute).data
        })
