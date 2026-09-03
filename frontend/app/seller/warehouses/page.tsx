"use client";

import React, { useState, useEffect } from "react";
import { WarehouseLocation } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { useRouter } from "next/navigation";
import { Warehouse, Plus, Store, MapPin, Phone, Clock, CheckCircle2, ShieldCheck, Eye, Edit, Settings, Package, BarChart } from "lucide-react";

export default function SellerWarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("Addis Ababa");
  const [subcity, setSubcity] = useState("Bole");
  const [streetAddress, setStreetAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isPickupPoint, setIsPickupPoint] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [pickupHours, setPickupHours] = useState("Mon–Sat: 9:00 AM – 7:00 PM");
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadWarehouses = () => {
    setLoading(true);
    inventoryService
      .getWarehouses()
      .then((data) => setWarehouses(data))
      .catch((err) => console.error("Failed to load facilities", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const openEditModal = (wh: WarehouseLocation) => {
    setEditId(wh.id);
    setName(wh.name);
    setCity(wh.city);
    setSubcity(wh.subcity || "");
    setStreetAddress(wh.street_address || "");
    setContactName(wh.contact_name || "");
    setContactPhone(wh.contact_phone || "");
    setIsPickupPoint(wh.is_pickup_point);
    setIsDefault(wh.is_default);
    setPickupHours(wh.pickup_operating_hours || "Mon–Sat: 9:00 AM – 7:00 PM");
    setModalOpen(true);
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await inventoryService.setPrimaryWarehouse(id);
      loadWarehouses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        name: name.trim(),
        city: city.trim(),
        subcity: subcity.trim(),
        street_address: streetAddress.trim(),
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        is_pickup_point: isPickupPoint,
        is_default: isDefault,
        pickup_operating_hours: isPickupPoint ? pickupHours.trim() : undefined,
      };

      if (editId) {
        await inventoryService.updateWarehouse(editId, payload);
      } else {
        await inventoryService.createWarehouse(payload);
      }

      setModalOpen(false);
      setEditId(null);
      setName("");
      setStreetAddress("");
      setIsDefault(false);
      loadWarehouses();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save facility.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Warehouse Facilities & Pickup Hubs</h1>
          <p className="text-xs text-gray-500">
            Manage distribution depots, urban branches, and customer Click-and-Collect locker locations
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setName("");
            setStreetAddress("");
            setContactName("");
            setContactPhone("");
            setIsPickupPoint(false);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Facility</span>
        </button>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400 text-sm">Loading facilities...</div>
        ) : (
          warehouses.map((wh) => (
            <div
              key={wh.id}
              className={`bg-white rounded-2xl p-6 border-2 transition-all shadow-xs flex flex-col justify-between ${
                wh.is_default ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/60 flex items-center justify-center text-emerald-700">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{wh.name}</h3>
                      <span className="font-mono text-[11px] text-gray-500 font-medium">[{wh.code}]</span>
                    </div>
                  </div>

                  {wh.is_default && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Primary Facility
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      {wh.street_address ? `${wh.street_address}, ` : ""}
                      {wh.subcity ? `${wh.subcity}, ` : ""}
                      {wh.city}
                    </span>
                  </div>

                  {wh.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{wh.contact_phone}</span>
                    </div>
                  )}

                  {wh.is_pickup_point && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px]">
                        <Store className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Enabled for Customer Click &amp; Collect</span>
                      </div>
                      {wh.pickup_operating_hours && (
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[10px]">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{wh.pickup_operating_hours}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inventory Summary Band */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-indigo-500" /> Stored SKUs</span>
                    <span>{wh.sku_count || 0} Active Products</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5 text-indigo-500" /> Total Stock On Hand</span>
                    <span>{wh.total_units || 0} Units</span>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => router.push(`/seller/inventory?warehouse_id=${wh.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Stock
                </button>
                <div className="flex gap-2 text-slate-500">
                  <button type="button" onClick={() => openEditModal(wh)} className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  {!wh.is_default && (
                    <button type="button" onClick={() => handleSetPrimary(wh.id)} className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Set Primary
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Facility Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{editId ? "Edit Warehouse Location" : "Add Warehouse Location"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">{errorMsg}</div>
            )}

            <form onSubmit={handleCreateWarehouse} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Facility Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bole Medhanialem Express Branch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City*</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subcity / Zone</label>
                  <input
                    type="text"
                    value={subcity}
                    onChange={(e) => setSubcity(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. Cameroon St, Near Edna Mall"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+251911..."
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Click-and-Collect Toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Set as Primary Facility</div>
                    <div className="text-xs text-slate-500">Make this the main fulfillment hub.</div>
                  </div>
                </label>

                <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>

                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={isPickupPoint}
                    onChange={(e) => setIsPickupPoint(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Enable as Customer Pickup Point (Click &amp; Collect)
                  </span>
                </label>

                {isPickupPoint && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Operating Hours</label>
                    <input
                      type="text"
                      value={pickupHours}
                      onChange={(e) => setPickupHours(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-xs"
                >
                  {formLoading ? "Saving..." : "Save Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
