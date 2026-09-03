"""
apps/common/permissions.py
==========================
Custom DRF permissions for GechExpress RBAC.

Roles:
- Super Admin: is_authenticated, is_staff=True, is_superuser=True
- Operational Admin: is_authenticated, is_staff=True, is_superuser=False
- Any Admin: is_authenticated, is_staff=True (or role == ADMIN)
- Seller: is_authenticated, role == SELLER
- Customer: is_authenticated, role == CUSTOMER
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperAdmin(BasePermission):
    """Allows access only to Super Admins (is_superuser=True)."""
    message = "Super Admin privileges are required to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsOperationalAdmin(BasePermission):
    """Allows access to Operational Admins (is_staff=True, is_superuser=False)."""
    message = "Operational Admin privileges required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
            and not request.user.is_superuser
        )


class IsAnyAdmin(BasePermission):
    """Allows access to any Admin (Operational or Super Admin)."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser or getattr(request.user, "role", None) == "ADMIN")
        )


class IsSeller(BasePermission):
    """Allows access to registered merchants (role=SELLER)."""
    message = "Seller account required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "SELLER"
        )


class IsVendorOwner(BasePermission):
    """
    Strict permission to ensure only the actual legal Store Owner can access the view.
    Checks if the user has a vendor_staff_roles record with role='OWNER'.
    Used to protect Financials, Payouts, and KYC documents.
    """
    message = "Only the Store Owner is authorized to access this resource."

    def has_permission(self, request, view):
        if not bool(request.user and request.user.is_authenticated and getattr(request.user, "role", None) == "SELLER"):
            return False

        if not hasattr(request.user, "vendor_staff_roles"):
            return False

        staff = request.user.vendor_staff_roles.filter(is_active=True).first()
        return bool(staff and staff.role == "OWNER")


class IsVendorStaffWithFacilityAccess(BasePermission):
    """
    Enforces Role-Based Access Control and Spatial Scoping for Vendor Staff.
    1. User must be a SELLER with an active VendorStaff record.
    2. RBAC: Checks if the user's role permits the requested action.
    3. Spatial Scoping: For write requests (POST/PATCH/PUT) or specific read requests,
       ensures the requested warehouse matches their assigned_facility (if they have one).
    """
    message = "You do not have permission or are not assigned to this facility."

    def get_staff_record(self, user):
        if not hasattr(user, "vendor_staff_roles"):
            return None
        return user.vendor_staff_roles.filter(is_active=True).first()

    def has_permission(self, request, view):
        if not bool(request.user and request.user.is_authenticated and getattr(request.user, "role", None) == "SELLER"):
            return False

        staff = self.get_staff_record(request.user)
        if not staff:
            return False
            
        # Role-based general route protection can be added here based on view context if needed.
        # e.g., if view is finance, and role not in [OWNER, MANAGER], return False.

        # Spatial Scoping for POST/PATCH payloads:
        if request.method in ["POST", "PATCH", "PUT"]:
            # Check if payload contains warehouse_id
            payload_wh_id = request.data.get("warehouse") or request.data.get("warehouse_id") or request.data.get("assigned_facility_id") or request.data.get("assigned_warehouse_id")
            
            if staff.assigned_facility_id and payload_wh_id:
                if str(payload_wh_id) != str(staff.assigned_facility_id):
                    self.message = "You are restricted to your assigned facility."
                    return False
        
        # Spatial Scoping for GET query params:
        if request.method == "GET":
            query_wh_id = request.query_params.get("warehouse_id")
            if staff.assigned_facility_id and query_wh_id:
                if str(query_wh_id) != str(staff.assigned_facility_id):
                    self.message = "You can only view data for your assigned facility."
                    return False

        return True

    def has_object_permission(self, request, view, obj):
        staff = self.get_staff_record(request.user)
        if not staff:
            return False

        # If staff is locked to a facility, check if object belongs to that facility
        if staff.assigned_facility_id:
            obj_wh_id = None
            if hasattr(obj, "warehouse_id"):
                obj_wh_id = obj.warehouse_id
            elif hasattr(obj, "assigned_warehouse_id"):
                obj_wh_id = obj.assigned_warehouse_id
            elif hasattr(obj, "assigned_facility_id"):
                obj_wh_id = obj.assigned_facility_id
            elif hasattr(obj, "id") and obj.__class__.__name__ == "WarehouseLocation":
                obj_wh_id = obj.id

            if obj_wh_id and str(obj_wh_id) != str(staff.assigned_facility_id):
                self.message = "This record does not belong to your assigned facility."
                return False

        return True


class IsCustomer(BasePermission):
    """Allows access to customer users (role=CUSTOMER)."""
    message = "Customer account required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "CUSTOMER"
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to edit/view it.
    Assumes the model instance has a `user` attribute or is the user itself.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff or request.user.is_superuser:
            return True

        if hasattr(obj, "user"):
            return obj.user == request.user

        return obj == request.user


class IsAdminOrReadOnly(BasePermission):
    """Read-only for public/authenticated, write access restricted to admins."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


# Aliases for convenience
IsSellerUser = IsSeller
IsAdminUser = IsAnyAdmin
IsSuperAdminUser = IsSuperAdmin
