"use client";

import React, { useState, useEffect, useMemo } from "react";
import { WarehouseLocation } from "@/features/inventory/types";
import { inventoryService } from "@/features/inventory/services/inventory-service";
import { useRouter } from "next/navigation";
import { Warehouse, Plus, Store, MapPin, Phone, Clock, CheckCircle2, ShieldCheck, Eye, Edit, Settings, Package, BarChart, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BoxModelIcon, HomeIcon, BackpackIcon } from "@radix-ui/react-icons";

export default function SellerWarehousesPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");

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

  const displayWarehouses = useMemo(() => {
    if (!searchQuery) return warehouses;
    const q = searchQuery.toLowerCase();
    return warehouses.filter((wh) => 
      wh.name.toLowerCase().includes(q) || 
      wh.city.toLowerCase().includes(q) ||
      (wh.subcity && wh.subcity.toLowerCase().includes(q))
    );
  }, [warehouses, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: warehouses.length,
      primary: warehouses.filter((w) => w.is_default).length,
      pickup: warehouses.filter((w) => w.is_pickup_point).length,
      totalSKUs: warehouses.reduce((acc, w) => acc + (w.sku_count || 0), 0),
      totalStock: warehouses.reduce((acc, w) => acc + (w.total_units || 0), 0),
    };
  }, [warehouses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-gray-900 dark:text-white">Warehouse Facilities</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage distribution depots, urban branches, and customer Click-and-Collect hubs.
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
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Facility</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Facilities</CardTitle>
            <Warehouse className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Primary Hubs</CardTitle>
            <HomeIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600">{stats.primary}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Pickup Points</CardTitle>
            <Store className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-indigo-600">{stats.pickup}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Unique SKUs</CardTitle>
            <BoxModelIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-amber-600">{stats.totalSKUs.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Stock Units</CardTitle>
            <BarChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-blue-600">{stats.totalStock.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by facility name, city, or subcity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-10 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 flex flex-col items-center justify-center text-sm text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            Loading your facilities...
          </div>
        ) : displayWarehouses.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center shadow-sm">
            <Warehouse className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No facilities found</h3>
            <p className="text-xs text-slate-500">Add a new warehouse to start managing inventory.</p>
          </div>
        ) : (
          displayWarehouses.map((wh) => (
            <div
              key={wh.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                wh.is_default ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{wh.name}</h3>
                      <span className="font-mono text-[11px] text-slate-500 font-medium">[{wh.code}]</span>
                    </div>
                  </div>

                  {wh.is_default && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">
                      {wh.street_address ? `${wh.street_address}, ` : ""}
                      {wh.subcity ? `${wh.subcity}, ` : ""}
                      {wh.city}
                    </span>
                  </div>

                  {wh.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{wh.contact_phone}</span>
                    </div>
                  )}

                  {wh.is_pickup_point && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300 text-[11px]">
                        <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Enabled for Customer Click &amp; Collect</span>
                      </div>
                      {wh.pickup_operating_hours && (
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400/80 text-[10px]">
                          <Clock className="w-3 h-3 text-emerald-600/70 dark:text-emerald-500" />
                          <span>{wh.pickup_operating_hours}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Inventory Summary Band */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-indigo-500" /> Stored SKUs</span>
                    <span>{wh.sku_count || 0} Active</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5 text-indigo-500" /> Total Stock</span>
                    <span>{wh.total_units?.toLocaleString() || 0} Units</span>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => router.push(`/seller/inventory?warehouse_id=${wh.id}`)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-xl transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Stock
                </button>
                <div className="flex gap-3 text-slate-500">
                  <button type="button" onClick={() => openEditModal(wh)} className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  {!wh.is_default && (
                    <button type="button" onClick={() => handleSetPrimary(wh.id)} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Primary
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
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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
