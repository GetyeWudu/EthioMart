from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

class InvitationService:
    @staticmethod
    def send_staff_invitation_email(invitation):
        vendor = invitation.vendor
        role_display = invitation.get_role_display()
        facility_name = invitation.assigned_facility.name if invitation.assigned_facility else "All Facilities"
        
        # Build invitation link
        invite_link = f"{settings.FRONTEND_URL}/seller/team/accept-invite?token={invitation.token}"

        subject = f"You've been invited to join {vendor.store_name} on GechExpress"
        
        # We can use a simple HTML template or string
        html_message = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #4f46e5;">Welcome to GechExpress!</h2>
            <p>You have been invited to join <strong>{vendor.store_name}</strong> as a <strong>{role_display}</strong>.</p>
            <p>Facility Access: <strong>{facility_name}</strong></p>
            <p>Click the button below to accept your invitation and join the team workspace:</p>
            <div style="margin: 30px 0;">
                <a href="{invite_link}" style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation & Join Team</a>
            </div>
            <p style="font-size: 12px; color: #666;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
        """
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            html_message=html_message,
            fail_silently=False,
        )
