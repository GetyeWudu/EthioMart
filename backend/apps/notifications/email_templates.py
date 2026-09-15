"""
apps/notifications/email_templates.py
======================================
Premium responsive HTML email templates for EthioMart transactional communications.
"""

from decimal import Decimal
from django.conf import settings
from django.utils import timezone


def _get_base_styles() -> str:
    return """
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            color: #1e293b;
        }
        table {
            border-collapse: collapse;
        }
        a {
            text-decoration: none;
        }
    """


def render_order_receipt_html(order, recipient_name: str = None) -> str:
    """
    Renders a world-class e-commerce order confirmation and receipt email.
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "https://ethio-mart-ten.vercel.app").rstrip("/")
    track_order_url = f"{frontend_url}/customer/orders/{order.id}"

    # Customer Name
    if not recipient_name:
        if order.shipping_address and isinstance(order.shipping_address, dict):
            first = order.shipping_address.get("firstName") or order.shipping_address.get("first_name", "")
            last = order.shipping_address.get("lastName") or order.shipping_address.get("last_name", "")
            recipient_name = f"{first} {last}".strip()
        if not recipient_name and order.customer:
            recipient_name = order.customer.get_full_name() or order.customer.first_name
        if not recipient_name:
            recipient_name = "Valued Customer"

    # Shipping Address Formatting
    shipping_lines = []
    if order.shipping_address and isinstance(order.shipping_address, dict):
        addr = order.shipping_address
        full_name = f"{addr.get('firstName', '')} {addr.get('lastName', '')}".strip()
        if full_name:
            shipping_lines.append(f"<strong>{full_name}</strong>")
        location_parts = [addr.get("subcity"), addr.get("kebele"), addr.get("city")]
        location = ", ".join([p for p in location_parts if p])
        if location:
            shipping_lines.append(location)
        phone = addr.get("phone") or addr.get("phoneNumber")
        if phone:
            shipping_lines.append(f"Tel: {phone}")

    shipping_html = "<br/>".join(shipping_lines) if shipping_lines else "Doorstep Delivery Address on File"

    # Items table rows
    items_rows = []
    subtotal_calculated = Decimal("0.00")

    for sub_order in order.sub_orders.all():
        vendor_name = sub_order.vendor.store_name if sub_order.vendor else "EthioMart Partner"
        for item in sub_order.items.all():
            prod_title = "Product"
            variant_info = ""
            if item.variant:
                if hasattr(item.variant, "product") and item.variant.product:
                    prod_title = getattr(item.variant.product, "title", None) or getattr(item.variant.product, "name", "Product")
                attrs = getattr(item.variant, "attributes", None)
                if attrs and isinstance(attrs, dict):
                    variant_info = " • ".join([f"{k}: {v}" for k, v in attrs.items()])
                elif item.variant.sku:
                    variant_info = f"SKU: {item.variant.sku}"

            line_total = item.unit_price * item.quantity
            subtotal_calculated += line_total

            items_rows.append(f"""
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 14px 12px 14px 0; vertical-align: top;">
                        <div style="font-weight: 600; font-size: 14px; color: #0f172a; margin-bottom: 3px;">
                            {prod_title}
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            Sold by: <span style="color: #2563eb; font-weight: 500;">{vendor_name}</span>
                            {f' • {variant_info}' if variant_info else ''}
                        </div>
                    </td>
                    <td style="padding: 14px 8px; text-align: center; vertical-align: top; font-size: 13px; color: #475569; font-weight: 600;">
                        x{item.quantity}
                    </td>
                    <td style="padding: 14px 0 14px 8px; text-align: right; vertical-align: top; font-size: 14px; font-weight: 700; color: #0f172a; white-space: nowrap;">
                        ETB {line_total:,.2f}
                    </td>
                </tr>
            """)

    items_table_content = "".join(items_rows) if items_rows else """
        <tr>
            <td colspan="3" style="padding: 16px 0; text-align: center; color: #64748b; font-size: 14px;">
                Order items confirmed.
            </td>
        </tr>
    """

    subtotal_display = order.total_amount - (order.total_shipping_fee or Decimal("0.00")) + (order.discount_applied or Decimal("0.00"))
    if subtotal_display < Decimal("0.00"):
        subtotal_display = subtotal_calculated

    created_date = order.created_at.strftime("%B %d, %Y at %I:%M %p") if getattr(order, "created_at", None) else timezone.now().strftime("%B %d, %Y")

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmed - Order #{order.order_number}</title>
        <style>
            {_get_base_styles()}
        </style>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9;">
            <tr>
                <td align="center" style="padding: 12px;">
                    <!-- Main Card -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
                        
                        <!-- Ethiopian Flag Tribute Accent Bar -->
                        <tr>
                            <td style="height: 5px; background: linear-gradient(90deg, #10b981 0%, #10b981 33%, #f59e0b 33%, #f59e0b 66%, #ef4444 66%, #ef4444 100%);"></td>
                        </tr>

                        <!-- Brand Header -->
                        <tr>
                            <td style="padding: 28px 32px 20px 32px; background: #0f172a; text-align: left;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td>
                                            <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.8px; line-height: 1;">
                                                Ethio<span style="color: #10b981;">Mart</span>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 5px;">
                                                Ethiopian Premier Marketplace
                                            </div>
                                        </td>
                                        <td align="right">
                                            <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                ✓ Paid & Confirmed
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Hero Greeting Banner -->
                        <tr>
                            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff;">
                                <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #ecfdf5; text-align: center; color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 16px; border: 2px solid #a7f3d0;">
                                    ✓
                                </div>
                                <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                                    Payment Confirmed!
                                </h1>
                                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #475569;">
                                    Hi <strong>{recipient_name}</strong>, thank you for your order! We have confirmed your payment. Our verified sellers have been notified to package and dispatch your order.
                                </p>
                            </td>
                        </tr>

                        <!-- Order Metadata Box -->
                        <tr>
                            <td style="padding: 0 32px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
                                    <tr>
                                        <td width="50%" style="vertical-align: top;">
                                            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Order Number</div>
                                            <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: monospace;">#{order.order_number}</div>
                                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">{created_date}</div>
                                        </td>
                                        <td width="50%" style="vertical-align: top; text-align: right;">
                                            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Payment Method</div>
                                            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px;">Chapa / Telebirr</div>
                                            <div style="font-size: 12px; color: #059669; font-weight: 600; margin-top: 4px;">Verified Instant Escrow</div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Items Summary Section -->
                        <tr>
                            <td style="padding: 24px 32px 12px 32px;">
                                <div style="font-size: 15px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                                    Order Summary
                                </div>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <thead>
                                        <tr style="border-bottom: 2px solid #e2e8f0;">
                                            <th align="left" style="padding-bottom: 10px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Product</th>
                                            <th align="center" style="padding-bottom: 10px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Qty</th>
                                            <th align="right" style="padding-bottom: 10px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items_table_content}
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        <!-- Price Breakdown -->
                        <tr>
                            <td style="padding: 0 32px 24px 32px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Subtotal</td>
                                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #334155; text-align: right;">ETB {subtotal_display:,.2f}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Shipping & Delivery</td>
                                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #334155; text-align: right;">
                                            {'ETB ' + f'{order.total_shipping_fee:,.2f}' if order.total_shipping_fee else 'FREE'}
                                        </td>
                                    </tr>
                                    {f'''
                                    <tr>
                                        <td style="padding: 6px 0; font-size: 14px; color: #059669;">Coupon Discount ({order.coupon_code or 'Promo'})</td>
                                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #059669; text-align: right;">-ETB {order.discount_applied:,.2f}</td>
                                    </tr>
                                    ''' if order.discount_applied and order.discount_applied > Decimal('0.00') else ''}
                                    <tr style="border-top: 2px solid #0f172a;">
                                        <td style="padding: 14px 0 6px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Total Paid</td>
                                        <td style="padding: 14px 0 6px 0; font-size: 20px; font-weight: 900; color: #059669; text-align: right;">
                                            ETB {order.total_amount:,.2f}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Shipping Address & Escrow Protection -->
                        <tr>
                            <td style="padding: 0 32px 28px 32px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <!-- Shipping Card -->
                                        <td width="48%" style="vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                                            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                                                📍 Delivery Destination
                                            </div>
                                            <div style="font-size: 13px; line-height: 1.5; color: #334155;">
                                                {shipping_html}
                                            </div>
                                        </td>
                                        <td width="4%"></td>
                                        <!-- Escrow Protection Badge -->
                                        <td width="48%" style="vertical-align: top; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px;">
                                            <div style="font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; margin-bottom: 6px;">
                                                🛡️ Escrow Guarantee
                                            </div>
                                            <div style="font-size: 12px; line-height: 1.5; color: #1e40af;">
                                                Your payment is protected. EthioMart holds funds securely in escrow until you receive and verify your products.
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Action Button -->
                        <tr>
                            <td style="padding: 0 32px 36px 32px; text-align: center;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{track_order_url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 38px; font-size: 15px; font-weight: 700; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); letter-spacing: 0.3px;">
                                                View & Track Order Online →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <div style="font-size: 12px; color: #94a3b8; margin-top: 14px;">
                                    Direct link: <a href="{track_order_url}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">{track_order_url}</a>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                                <div style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 4px;">
                                    Questions about your order?
                                </div>
                                <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
                                    Contact support at <a href="mailto:support@ethiomart.com" style="color: #2563eb; font-weight: 500;">support@ethiomart.com</a> or visit our <a href="{frontend_url}/help" style="color: #2563eb; font-weight: 500;">Help Center</a>.
                                </div>
                                <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                    © 2026 EthioMart Marketplace, Inc. Addis Ababa, Ethiopia.<br/>
                                    This is a transactional receipt for order #{order.order_number}.
                                </div>
                            </td>
                        </tr>

                    </table>
                    <!-- End Main Card -->
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html.strip()


def render_general_notification_html(
    title: str,
    message: str,
    user_name: str = None,
    action_url: str = None,
    action_label: str = None,
    badge: str = None
) -> str:
    """
    Universal premium branded HTML template for platform notifications (disputes, updates, etc).
    """
    frontend_url = getattr(settings, "FRONTEND_URL", "https://ethio-mart-ten.vercel.app").rstrip("/")
    recipient = user_name or "Valued Customer"
    badge_text = badge or "Notification"

    button_html = ""
    if action_url:
        target_url = action_url if action_url.startswith("http") else f"{frontend_url}{action_url}"
        lbl = action_label or "View Details →"
        button_html = f"""
            <div style="margin: 28px 0; text-align: center;">
                <a href="{target_url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                    {lbl}
                </a>
            </div>
        """

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            {_get_base_styles()}
        </style>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9;">
            <tr>
                <td align="center" style="padding: 12px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                        
                        <!-- Top Ethiopian Accent Bar -->
                        <tr>
                            <td style="height: 4px; background: linear-gradient(90deg, #10b981 0%, #10b981 33%, #f59e0b 33%, #f59e0b 66%, #ef4444 66%, #ef4444 100%);"></td>
                        </tr>

                        <!-- Brand Header -->
                        <tr>
                            <td style="padding: 24px 28px; background: #0f172a; text-align: left;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td>
                                            <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                                                Ethio<span style="color: #10b981;">Mart</span>
                                            </div>
                                        </td>
                                        <td align="right">
                                            <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: #cbd5e1; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                                                {badge_text}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 32px 28px 24px 28px;">
                                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                                    {title}
                                </h2>
                                <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
                                    Hello <strong>{recipient}</strong>,
                                </p>
                                <div style="font-size: 15px; color: #334155; line-height: 1.6; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px;">
                                    {message}
                                </div>

                                {button_html}
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                                <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                    © 2026 EthioMart Marketplace. Addis Ababa, Ethiopia.<br/>
                                    If you have questions, please reach out to <a href="mailto:support@ethiomart.com" style="color: #2563eb;">support@ethiomart.com</a>.
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html.strip()
