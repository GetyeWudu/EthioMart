"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Store,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  User,
  Calendar,
  Hash,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Receipt,
} from "lucide-react";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "PAID":
    case "DELIVERED":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 text-[11px] font-bold gap-1.5 uppercase tracking-wide px-3 py-1">
          <CheckCircle2 className="h-3 w-3" /> {s}
        </Badge>
      );
    case "SHIPPED":
    case "DISPATCHED":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 text-[11px] font-bold gap-1.5 uppercase tracking-wide px-3 py-1">
          <Truck className="h-3 w-3" /> {s}
        </Badge>
      );
    case "PROCESSING":
    case "READY_FOR_DISPATCH":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 text-[11px] font-bold gap-1.5 uppercase tracking-wide px-3 py-1">
          <Package className="h-3 w-3" /> {s}
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[11px] font-bold uppercase tracking-wide px-3 py-1">
          CANCELLED
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1"
        >
          <Clock className="h-3 w-3" /> {s || "PENDING"}
        </Badge>
      );
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 mt-0.5 shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, error, isLoading } = useSWR(
    id ? `/admin/orders/${id}/` : null,
    fetcher
  );

  const cleanOrderNumber = (num: string) => {
    if (!num) return "N/A";
    return num.replace(/^#?ORD-#?ORD-/, "ORD-").replace(/^#/, "");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Order not found or failed to load.
        </p>
        <Link
          href="/admin/orders"
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const cust = order.customer_details;
  const addr = order.shipping_address || {};
  const custFullName = `${cust?.first_name || "Customer"} ${cust?.last_name || ""}`.trim();
  const totalAmt = parseFloat(order.total_amount || 0);
  const totalShipping = parseFloat(order.total_shipping_fee || 0);
  const platformFee = totalAmt * 0.1;
  const vendorRevenue = totalAmt - platformFee;
  const cleanNum = cleanOrderNumber(order.order_number);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-700 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                #{cleanNum}
              </h1>
              <StatusBadge status={order.payment_status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Placed{" "}
              {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main — left 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Sub-orders */}
          {order.sub_orders?.length > 0 ? (
            order.sub_orders.map((sub: any, idx: number) => {
              const subTotal = parseFloat(sub.sub_total || 0);
              const shippingFee = parseFloat(sub.shipping_fee || 0);
              const platformCut = subTotal * 0.1;
              const vName =
                sub.vendor_name || sub.vendor?.store_name || "Merchant Store";

              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
                >
                  {/* Sub-order header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                          Vendor · Sub-order {idx + 1}
                        </p>
                        <Link
                          href={`/admin/sellers/${sub.vendor_id || sub.vendor?.id || ""}`}
                          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          {vName}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        #SUB-{String(sub.id).slice(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge
                        status={
                          sub.derived_status ||
                          sub.items?.[0]?.status ||
                          "PENDING"
                        }
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sub.items?.map((item: any) => {
                      const unitPrice = parseFloat(item.unit_price || 0);
                      const lineTotal = unitPrice * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 px-5 py-4"
                        >
                          <div className="relative h-14 w-14 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
                            <Image
                              src={
                                item.variant_details?.product?.images?.[0]
                                  ?.image_url ||
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200"
                              }
                              alt="Product"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.variant_details?.product?.title || "Product"}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              SKU: {item.variant_details?.sku || "N/A"} &nbsp;·&nbsp; Qty:{" "}
                              {item.quantity}
                            </p>
                            <div className="mt-1">
                              <StatusBadge status={item.status} />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-slate-400 font-mono">
                              ETB {unitPrice.toLocaleString("en-ET", { minimumFractionDigits: 2 })} × {item.quantity}
                            </p>
                            <p className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                              ETB{" "}
                              {lineTotal.toLocaleString("en-ET", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sub-order footer */}
                  <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 flex flex-wrap justify-between items-center gap-2 text-xs">
                    <div className="flex items-center gap-4">
                      {sub.coupon_code && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Coupon: {sub.coupon_code} (−ETB{" "}
                          {parseFloat(sub.discount_applied || 0).toFixed(2)})
                        </span>
                      )}
                      {shippingFee > 0 && (
                        <span className="text-slate-500">
                          Shipping: ETB {shippingFee.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">
                        Subtotal:{" "}
                        <strong className="text-slate-900 dark:text-white font-mono">
                          ETB {subTotal.toFixed(2)}
                        </strong>
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                        Platform 10%: ETB {platformCut.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm text-slate-500">No sub-orders found.</p>
            </div>
          )}
        </div>

        {/* Sidebar — right 1/3 */}
        <div className="space-y-5">
          {/* Financial Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Order Summary
              </h3>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  ETB{" "}
                  {(totalAmt - totalShipping).toLocaleString("en-ET", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {totalShipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-semibold text-slate-900 dark:text-white font-mono">
                    ETB{" "}
                    {totalShipping.toLocaleString("en-ET", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              {order.discount_applied && parseFloat(order.discount_applied) > 0 && (
                <div className="flex justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Discount
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    −ETB{" "}
                    {parseFloat(order.discount_applied).toLocaleString("en-ET", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex justify-between text-sm">
                <span className="font-bold text-slate-900 dark:text-white">
                  Total
                </span>
                <span className="font-black text-slate-900 dark:text-white font-mono">
                  ETB{" "}
                  {totalAmt.toLocaleString("en-ET", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 mt-1 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    Platform fee (10%)
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ETB {platformFee.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Vendor revenue (90%)
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ETB {vendorRevenue.toLocaleString("en-ET", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Customer
              </h3>
              {cust?.id && (
                <Link
                  href={`/admin/customers/${cust.id}`}
                  className="ml-auto text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  View <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {custFullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {custFullName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {cust?.id ? `ID: ${String(cust.id).slice(0, 8)}…` : "Guest"}
                  </p>
                </div>
              </div>
              <div className="space-y-0">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={cust?.email || "—"}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={cust?.phone_number || "—"}
                />
              </div>
            </div>
          </div>

          {/* Order metadata */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Order Info
              </h3>
            </div>
            <div className="px-5 py-4">
              <InfoRow icon={Hash} label="Order Number" value={`#${cleanNum}`} />
              <InfoRow
                icon={Calendar}
                label="Placed At"
                value={new Date(order.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <InfoRow
                icon={CreditCard}
                label="Payment Status"
                value={<StatusBadge status={order.payment_status} />}
              />
              <InfoRow
                icon={Truck}
                label="Delivery Method"
                value={
                  order.delivery_method === "PICKUP"
                    ? "Station Pickup"
                    : "Doorstep Delivery"
                }
              />
              {order.coupon_code && (
                <InfoRow
                  icon={Receipt}
                  label="Coupon"
                  value={order.coupon_code}
                />
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {(addr.city || addr.address || addr.street) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Shipping Address
                </h3>
              </div>
              <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                {addr.full_name && (
                  <p className="font-bold text-slate-900 dark:text-white">
                    {addr.full_name}
                  </p>
                )}
                {addr.address && <p>{addr.address}</p>}
                {addr.street && <p>{addr.street}</p>}
                {(addr.city || addr.region) && (
                  <p>
                    {[addr.city, addr.region].filter(Boolean).join(", ")}
                  </p>
                )}
                {addr.country && <p>{addr.country}</p>}
                {addr.phone_number && (
                  <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {addr.phone_number}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
