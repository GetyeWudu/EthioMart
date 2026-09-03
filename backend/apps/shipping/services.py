from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Union, Optional, Tuple
from django.core.exceptions import ValidationError
from apps.catalog.models import ProductVariant
from apps.inventory.models import WarehouseStock, WarehouseLocation
from apps.shipping.models import ShippingZone, ShippingZoneRate
from apps.shipping.enums import ShippingClass


CLASS_PRIORITY = {
    ShippingClass.DIGITAL: 0,
    ShippingClass.STANDARD: 1,
    ShippingClass.HEAVY: 2,
    ShippingClass.FRAGILE: 3,
    ShippingClass.BULKY: 4,
}

# Intra-City Standard Delivery Rates (Same Metro Area e.g. Addis -> Addis, BHR -> BHR, GDR -> GDR)
INTRA_CITY_RATES = {
    ShippingClass.STANDARD: {"base_fee": Decimal("100.00"), "per_kg_rate": Decimal("20.00"), "min_days": 1, "max_days": 1},
    ShippingClass.HEAVY: {"base_fee": Decimal("300.00"), "per_kg_rate": Decimal("35.00"), "min_days": 1, "max_days": 2},
    ShippingClass.BULKY: {"base_fee": Decimal("800.00"), "per_kg_rate": Decimal("50.00"), "min_days": 2, "max_days": 3},
    ShippingClass.FRAGILE: {"base_fee": Decimal("150.00"), "per_kg_rate": Decimal("25.00"), "min_days": 1, "max_days": 2},
}

# Regional Short-Haul Pairs (Adjacent Regional Centers, e.g. Bahir Dar <-> Gondar ~175 km)
REGIONAL_SHORT_HAUL_PAIRS = {
    ("BHR", "GDR"),
    ("GDR", "BHR"),
    ("ADD", "ADDIS-O"),
    ("ADDIS-O", "ADD"),
    ("ADDIS-C", "ADDIS-O"),
    ("ADDIS-O", "ADDIS-C"),
}

REGIONAL_SHORT_HAUL_RATES = {
    ShippingClass.STANDARD: {"base_fee": Decimal("130.00"), "per_kg_rate": Decimal("22.00"), "min_days": 1, "max_days": 2},
    ShippingClass.HEAVY: {"base_fee": Decimal("380.00"), "per_kg_rate": Decimal("38.00"), "min_days": 2, "max_days": 3},
    ShippingClass.BULKY: {"base_fee": Decimal("1100.00"), "per_kg_rate": Decimal("55.00"), "min_days": 3, "max_days": 4},
    ShippingClass.FRAGILE: {"base_fee": Decimal("200.00"), "per_kg_rate": Decimal("28.00"), "min_days": 1, "max_days": 2},
}


def normalize_city_to_zone_code(city_str: Optional[str]) -> str:
    """Normalizes warehouse or store city names to standardized zone codes."""
    if not city_str:
        return "ADD"
    normalized = city_str.strip().upper()
    if "BAHIR" in normalized or "BAHR" in normalized or "BHR" in normalized:
        return "BHR"
    if "GONDAR" in normalized or "GONDER" in normalized or "GDR" in normalized:
        return "GDR"
    if "OROMIA" in normalized or "ADAMA" in normalized or "NAZRET" in normalized or "BISHOFTU" in normalized:
        return "OROMIA"
    if "TIGRAY" in normalized or "MEKELLE" in normalized or "MEKELE" in normalized:
        return "TIGRAY"
    if "SIDAMA" in normalized or "HAWASSA" in normalized or "AWASSA" in normalized:
        return "SIDAMA"
    if "AMHARA" in normalized or "DESSIE" in normalized:
        return "AMHARA"
    return "ADD"  # Default Addis Ababa hub


class ShippingCalculator:
    """
    Multi-Hub Origin-Aware Tiered Shipping Engine.
    Groups items by (Vendor, Fulfilling Warehouse) dispatch legs:
    - Items from the same warehouse pool under one package (single base fee).
    - Items from different warehouses create separate dispatch packages with independent line-hauls.
    - Dynamically evaluates Intra-City, Regional Short-Haul, and Cross-Regional rates per package.
    """

    @classmethod
    def resolve_item_fulfilling_warehouse(
        cls,
        variant: ProductVariant,
        dest_zone: ShippingZone,
        vendor: Any,
        selected_facility: Optional[WarehouseLocation] = None
    ) -> Tuple[Optional[WarehouseLocation], str, str, str]:
        """
        Determines the optimal fulfilling warehouse and route for an individual item variant.
        Returns: (warehouse, origin_zone_code, route_type, route_label)
        """
        dest_zone_code = dest_zone.code.upper() if dest_zone else "ADD"
        dest_city_name = dest_zone.name if dest_zone else "Addis Ababa"

        if selected_facility:
            wh = selected_facility
            origin_city = wh.city or "Addis Ababa"
            origin_zone_code = normalize_city_to_zone_code(origin_city)
            if origin_zone_code == dest_zone_code or (wh.city and wh.city.strip().upper() == dest_city_name.strip().upper()):
                return wh, origin_zone_code, "INTRA_CITY", f"Intra-City Delivery ({origin_city} → {dest_city_name})"
            elif (origin_zone_code, dest_zone_code) in REGIONAL_SHORT_HAUL_PAIRS:
                return wh, origin_zone_code, "REGIONAL_SHORT_HAUL", f"Regional Line-Haul ({origin_city} → {dest_city_name})"
            else:
                return wh, origin_zone_code, "CROSS_REGIONAL", f"Cross-Regional Line-Haul ({origin_city} → {dest_city_name})"

        # 1. Query all warehouses holding inventory for this specific variant
        stocks = WarehouseStock.objects.filter(
            variant=variant,
            warehouse__vendor=vendor,
            quantity_on_hand__gt=0
        ).select_related("warehouse")

        candidate_warehouses = [s.warehouse for s in stocks]

        # Fallback to vendor default/active warehouse if no stock records exist yet
        if not candidate_warehouses:
            default_wh = WarehouseLocation.objects.filter(vendor=vendor, is_default=True).first()
            if not default_wh:
                default_wh = WarehouseLocation.objects.filter(vendor=vendor, is_active=True).first()
            if default_wh:
                candidate_warehouses.append(default_wh)

        # 2. Prefer warehouse in the destination city (Intra-city fulfillment)
        chosen_wh = None
        for wh in candidate_warehouses:
            wh_zone_code = normalize_city_to_zone_code(wh.city)
            if wh_zone_code == dest_zone_code or (wh.city and wh.city.upper() in dest_city_name.upper()):
                chosen_wh = wh
                break

        # 3. If no exact local warehouse, prefer regional short-haul
        if not chosen_wh:
            for wh in candidate_warehouses:
                wh_zone_code = normalize_city_to_zone_code(wh.city)
                if (wh_zone_code, dest_zone_code) in REGIONAL_SHORT_HAUL_PAIRS:
                    chosen_wh = wh
                    break

        # 4. Fallback to first warehouse holding inventory
        if not chosen_wh and candidate_warehouses:
            chosen_wh = candidate_warehouses[0]

        origin_city = chosen_wh.city if chosen_wh else getattr(vendor, "city", "Addis Ababa") or "Addis Ababa"
        origin_zone_code = normalize_city_to_zone_code(origin_city)

        if origin_zone_code == dest_zone_code or (chosen_wh and chosen_wh.city and chosen_wh.city.strip().upper() == dest_city_name.strip().upper()):
            route_type = "INTRA_CITY"
            route_label = f"Intra-City Delivery ({origin_city} → {dest_city_name})"
        elif (origin_zone_code, dest_zone_code) in REGIONAL_SHORT_HAUL_PAIRS:
            route_type = "REGIONAL_SHORT_HAUL"
            route_label = f"Regional Line-Haul ({origin_city} → {dest_city_name})"
        else:
            route_type = "CROSS_REGIONAL"
            route_label = f"Cross-Regional Line-Haul ({origin_city} → {dest_city_name})"

        return chosen_wh, origin_zone_code, route_type, route_label

    @classmethod
    def calculate(cls, cart_items: List[Union[Dict[str, Any], Any]], zone_id: Union[str, Any]) -> Dict[str, Any]:
        if not zone_id:
            raise ValidationError("Shipping zone is required.")

        try:
            zone = ShippingZone.objects.get(id=zone_id, is_active=True)
        except (ShippingZone.DoesNotExist, ValueError):
            raise ValidationError("Invalid or inactive shipping zone.")

        if not cart_items:
            return {
                "total_shipping_fee": Decimal("0.00"),
                "estimated_delivery": {"min_days": 1, "max_days": 3},
                "n_packages": 0,
                "n_vendors": 0,
                "sub_orders": [],
            }

        # 1. Parse and group items into dispatch packages by (Vendor, Fulfilling Warehouse)
        dispatch_packages: Dict[str, Dict[str, Any]] = {}

        for raw_item in cart_items:
            if isinstance(raw_item, dict):
                variant_id = raw_item.get("variant") or raw_item.get("variant_id")
                qty = int(raw_item.get("quantity", 1))
                selected_fac_id = raw_item.get("selected_facility")
            else:
                variant_id = getattr(raw_item, "variant_id", None)
                if not variant_id and hasattr(raw_item, "variant"):
                    variant_id = raw_item.variant.id
                qty = int(getattr(raw_item, "quantity", 1))
                selected_fac_id = getattr(raw_item, "selected_facility_id", None)

            if not variant_id or qty <= 0:
                continue

            try:
                variant = ProductVariant.objects.select_related("product", "product__vendor").get(id=variant_id)
            except ProductVariant.DoesNotExist:
                continue

            vendor = variant.product.vendor
            vendor_id_str = str(vendor.id)

            selected_facility = None
            if selected_fac_id:
                selected_facility = WarehouseLocation.objects.filter(id=selected_fac_id).first()

            # Resolve fulfilling warehouse for this specific item
            fulfilling_wh, origin_code, route_type, route_label = cls.resolve_item_fulfilling_warehouse(
                variant=variant,
                dest_zone=zone,
                vendor=vendor,
                selected_facility=selected_facility
            )

            p_class = getattr(variant.product, "shipping_class", ShippingClass.STANDARD) or ShippingClass.STANDARD
            if p_class == ShippingClass.DIGITAL:
                pkg_key = f"{vendor_id_str}:DIGITAL"
            else:
                wh_key = str(fulfilling_wh.id) if fulfilling_wh else "DEFAULT"
                pkg_key = f"{vendor_id_str}:{wh_key}"

            if pkg_key not in dispatch_packages:
                dispatch_packages[pkg_key] = {
                    "pkg_key": pkg_key,
                    "vendor": vendor,
                    "vendor_id": vendor_id_str,
                    "vendor_name": vendor.store_name,
                    "fulfilling_warehouse": fulfilling_wh,
                    "origin_zone_code": origin_code,
                    "route_type": route_type,
                    "route_label": route_label,
                    "items": [],
                }

            dispatch_packages[pkg_key]["items"].append({
                "variant": variant,
                "product": variant.product,
                "quantity": qty,
            })

        if not dispatch_packages:
            return {
                "total_shipping_fee": Decimal("0.00"),
                "estimated_delivery": {"min_days": 1, "max_days": 3},
                "n_packages": 0,
                "n_vendors": 0,
                "sub_orders": [],
            }

        total_shipping_fee = Decimal("0.00")
        packages_result = []
        overall_min_days = None
        overall_max_days = None

        # 2. Compute fee per dispatch package
        for pkg_key, pkg in dispatch_packages.items():
            pkg_items = pkg["items"]
            fulfilling_wh = pkg["fulfilling_warehouse"]
            route_type = pkg["route_type"]
            route_label = pkg["route_label"]
            origin_code = pkg["origin_zone_code"]

            # Identify highest priority shipping class in package
            highest_class = ShippingClass.STANDARD
            highest_priority = -1
            all_digital = True

            for item in pkg_items:
                p_class = getattr(item["product"], "shipping_class", ShippingClass.STANDARD) or ShippingClass.STANDARD
                if p_class != ShippingClass.DIGITAL:
                    all_digital = False
                p_priority = CLASS_PRIORITY.get(p_class, 1)
                if p_priority > highest_priority:
                    highest_priority = p_priority
                    highest_class = p_class

            # If all items are digital, no shipping fee is charged
            if all_digital:
                packages_result.append({
                    "pkg_key": pkg_key,
                    "vendor_id": pkg["vendor_id"],
                    "vendor_name": pkg["vendor_name"],
                    "shipping_class": ShippingClass.DIGITAL,
                    "fulfilling_warehouse": None,
                    "route_type": "DIGITAL",
                    "route_label": "Instant Digital Delivery",
                    "pkg_chargeable_weight_kg": 0.0,
                    "base_fee": Decimal("0.00"),
                    "weight_fee": Decimal("0.00"),
                    "sub_order_shipping_fee": Decimal("0.00"),
                    "estimated_days_min": 0,
                    "estimated_days_max": 0,
                })
                continue

            # Determine rate based on origin-destination route
            if route_type == "INTRA_CITY":
                rate_info = INTRA_CITY_RATES.get(highest_class, INTRA_CITY_RATES[ShippingClass.STANDARD])
                base_fee = rate_info["base_fee"]
                per_kg_rate = rate_info["per_kg_rate"]
                min_days = rate_info["min_days"]
                max_days = rate_info["max_days"]
            elif route_type == "REGIONAL_SHORT_HAUL":
                rate_info = REGIONAL_SHORT_HAUL_RATES.get(highest_class, REGIONAL_SHORT_HAUL_RATES[ShippingClass.STANDARD])
                base_fee = rate_info["base_fee"]
                per_kg_rate = rate_info["per_kg_rate"]
                min_days = rate_info["min_days"]
                max_days = rate_info["max_days"]
            else:
                # Cross-regional: lookup destination zone rate matrix
                zone_rate = ShippingZoneRate.objects.filter(zone=zone, shipping_class=highest_class).first()
                if not zone_rate:
                    zone_rate = ShippingZoneRate.objects.filter(zone=zone, shipping_class=ShippingClass.STANDARD).first()

                if not zone_rate:
                    base_fee = Decimal("150.00")
                    per_kg_rate = Decimal("25.00")
                    min_days = 2
                    max_days = 4
                else:
                    base_fee = zone_rate.base_fee
                    per_kg_rate = zone_rate.per_kg_rate
                    min_days = zone_rate.estimated_days_min
                    max_days = zone_rate.estimated_days_max

            if overall_min_days is None or min_days < overall_min_days:
                overall_min_days = min_days
            if overall_max_days is None or max_days > overall_max_days:
                overall_max_days = max_days

            # Compute total chargeable weight for the package
            pkg_chargeable_weight = Decimal("0.00")

            for item in pkg_items:
                product = item["product"]
                variant = item["variant"]
                qty = Decimal(str(item["quantity"]))

                p_class = getattr(product, "shipping_class", ShippingClass.STANDARD)
                if p_class == ShippingClass.DIGITAL:
                    continue

                actual_weight_unit = Decimal(str(getattr(variant, "weight_kg", Decimal("0.500")) or Decimal("0.500")))
                length = Decimal(str(getattr(product, "length_cm", Decimal("15.0")) or Decimal("15.0")))
                width = Decimal(str(getattr(product, "width_cm", Decimal("10.0")) or Decimal("10.0")))
                height = Decimal(str(getattr(product, "height_cm", Decimal("5.0")) or Decimal("5.0")))

                volumetric_weight_unit = (length * width * height) / Decimal("5000")
                chargeable_unit = max(actual_weight_unit, volumetric_weight_unit)
                # Zero-weight guardrail: enforce at least 0.01 kg per physical unit
                chargeable_unit = max(Decimal("0.01"), chargeable_unit)

                item_chargeable_weight = chargeable_unit * qty
                pkg_chargeable_weight += item_chargeable_weight

            weight_fee = (pkg_chargeable_weight * per_kg_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            sub_order_fee = (base_fee + weight_fee).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            total_shipping_fee += sub_order_fee

            wh_info = None
            if fulfilling_wh:
                wh_info = {
                    "id": str(fulfilling_wh.id),
                    "name": fulfilling_wh.name,
                    "code": fulfilling_wh.code,
                    "city": fulfilling_wh.city,
                    "origin_zone_code": origin_code,
                }

            packages_result.append({
                "pkg_key": pkg_key,
                "vendor_id": pkg["vendor_id"],
                "vendor_name": pkg["vendor_name"],
                "shipping_class": highest_class,
                "fulfilling_warehouse": wh_info,
                "route_type": route_type,
                "route_label": route_label,
                "pkg_chargeable_weight_kg": float(pkg_chargeable_weight),
                "base_fee": base_fee,
                "weight_fee": weight_fee,
                "sub_order_shipping_fee": sub_order_fee,
                "estimated_days_min": min_days,
                "estimated_days_max": max_days,
            })

        unique_vendors = len(set(p["vendor_id"] for p in packages_result))

        return {
            "total_shipping_fee": total_shipping_fee,
            "estimated_delivery": {
                "min_days": overall_min_days if overall_min_days is not None else 1,
                "max_days": overall_max_days if overall_max_days is not None else 3,
            },
            "n_packages": len(packages_result),
            "n_vendors": unique_vendors,
            "sub_orders": packages_result,
        }
