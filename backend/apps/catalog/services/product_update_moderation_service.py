from decimal import Decimal
import difflib
from apps.vendors.enums import TrustTier
from apps.catalog.enums import ProductStatus
from apps.catalog.models import AdminAuditAlert

class ProductUpdateModerationService:
    """
    Implements the Field-Level Trust-Tier Moderation for Product Updates.
    Evaluates deltas (Price Surges, Text Similarity) and applies the Seller Routing Rule.
    """

    @staticmethod
    def _evaluate_price_delta(old_price: Decimal, new_price: Decimal) -> bool:
        """
        Returns True if the change is a High Risk Price Surge (> +20%).
        """
        if not old_price or not new_price:
            return False
            
        old_val = Decimal(str(old_price))
        new_val = Decimal(str(new_price))
        
        if old_val == 0 and new_val > 0:
            return True # Zero-baseline edge case
            
        if old_val > 0:
            delta = (new_val - old_val) / old_val
            if delta > Decimal("0.20"):
                return True
                
        return False

    @staticmethod
    def _evaluate_text_similarity(old_text: str, new_text: str, threshold=0.85) -> bool:
        """
        Returns True if the text change is High Risk (< 85% similar).
        """
        if not old_text and not new_text:
            return False
        if not old_text and new_text:
            return True
            
        ratio = difflib.SequenceMatcher(None, old_text, new_text).ratio()
        return ratio < threshold

    @classmethod
    def evaluate_edit_risk(cls, product, old_data: dict, new_data: dict) -> list:
        """
        Returns a list of high-risk flags. If empty, it's a Low-Risk edit.
        """
        flags = []
        
        # 1. Price Surge Check
        # We need to check variant prices if passed, or the base price.
        # Assuming new_data might contain 'variants_data'
        if "variants_data" in new_data:
            for v_data in new_data["variants_data"]:
                try:
                    variant_id = v_data.get("id")
                    if variant_id and "price" in v_data:
                        old_variant = product.variants.get(id=variant_id)
                        if cls._evaluate_price_delta(old_variant.price, v_data["price"]):
                            flags.append(f"Price surge detected on variant {variant_id}")
                except Exception:
                    pass
        elif "price" in new_data:
            # Simple product base price check
            # Not natively on product model but via single variant or via product_service
            pass

        # 2. Title Similarity Check
        if "title" in new_data and new_data["title"] != old_data.get("title"):
            if cls._evaluate_text_similarity(old_data.get("title", ""), new_data["title"]):
                flags.append("Major title change detected (similarity < 85%)")

        # 3. Description Change
        if "description" in new_data and new_data["description"] != old_data.get("description"):
            # Could use similarity, but the spec says description change is HIGH
            flags.append("Description was modified")

        # 4. Primary Image Change
        if "primary_image_id" in new_data:
            # We assume updating primary image is HIGH
            flags.append("Primary featured image was replaced")

        return flags

    @classmethod
    def route_update(cls, product, old_data: dict, new_data: dict, vendor):
        """
        Executes the Trust-Tier Matrix.
        Returns (action_taken, new_status, is_published, flagged_reasons)
        action_taken choices: "AUTO_APPROVED", "PULLED_FOR_REVIEW"
        """
        flags = cls.evaluate_edit_risk(product, old_data, new_data)
        is_high_risk = len(flags) > 0
        
        if not is_high_risk:
            # Low Risk: Always Auto-Approve
            return "AUTO_APPROVED", product.status, True, []
            
        # High Risk Logic
        if vendor.tier == TrustTier.PROBATION:
            return "PULLED_FOR_REVIEW", ProductStatus.PENDING_REVIEW, False, flags
            
        elif vendor.tier == TrustTier.VERIFIED:
            # Auto-Approve but create Audit Alert
            alert = AdminAuditAlert.objects.create(
                product=product,
                seller=vendor,
                alert_type=AdminAuditAlert.AlertType.MAJOR_CONTENT_EDIT,
                diff_payload={
                    "flags": flags,
                    "old_title": old_data.get("title"),
                    "new_title": new_data.get("title"),
                }
            )
            return "AUTO_APPROVED", product.status, True, flags
            
        elif vendor.tier == TrustTier.TOP_SELLER:
            # Top Seller -> Full Auto Approve
            return "AUTO_APPROVED", product.status, True, []
            
        # Fallback
        return "PULLED_FOR_REVIEW", ProductStatus.PENDING_REVIEW, False, flags

