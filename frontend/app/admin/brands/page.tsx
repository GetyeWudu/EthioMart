"use client";

import React, { useState, useEffect } from "react";
import { Brand } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { Plus, Check, AlertCircle, Edit, Trash2, X, Award, Globe, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RootCategory {
  id: string;
  name: string;
  name_am?: string;
  slug: string;
  icon?: string;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [rootCategories, setRootCategories] = useState<RootCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bnds, cats] = await Promise.all([
        catalogService.getBrands(),
        catalogService.getRootCategories(),
      ]);
      setBrands(bnds);
      setRootCategories(cats as RootCategory[]);
    } catch (err) {
      console.error("Failed to load brands data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setName(""); setNameAm(""); setWebsite("");
    setSelectedCategoryIds([]); setLogoFile(null); setLogoPreview("");
    setErrorMsg(null);
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setNameAm(brand.name_am || "");
    setWebsite((brand as any).website || "");
    setSelectedCategoryIds(brand.categories?.map((c: any) => c.id) || []);
    setLogoFile(null);
    setLogoPreview(brand.logo || "");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);

    try {
      let payload: any;

      if (logoFile) {
        // Use FormData when a new logo file is selected
        const fd = new FormData();
        fd.append("name", name.trim());
        if (nameAm.trim()) fd.append("name_am", nameAm.trim());
        if (website.trim()) fd.append("website", website.trim());
        fd.append("logo", logoFile);
        // Send category_ids as comma-separated string for multipart
        if (selectedCategoryIds.length > 0) {
          fd.append("category_ids", selectedCategoryIds.join(","));
        }
        payload = fd;
      } else {
        // Clean JSON payload when no logo
        payload = JSON.stringify({
          name: name.trim(),
          name_am: nameAm.trim() || "",
          website: website.trim() || "",
          logo: null,
          category_ids: selectedCategoryIds,
        });
      }

      if (editingBrand) {
        await catalogService.updateBrand(editingBrand.id, logoFile ? payload : JSON.parse(payload as string));
        toast.success("Brand updated successfully!");
      } else {
        await catalogService.createBrand(logoFile ? payload : JSON.parse(payload as string));
        toast.success("Brand created successfully!");
      }

      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save brand. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (brandId: string, brandName: string) => {
    if (!confirm(`Delete "${brandName}"? This action cannot be undone.`)) return;
    try {
      await catalogService.deleteBrand(brandId);
      toast.success("Brand deleted.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete brand.");
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVertical, setSelectedVertical] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredBrands = brands.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesVertical = true;
    if (selectedVertical === "GLOBAL") {
      matchesVertical = !b.categories || b.categories.length === 0;
    } else if (selectedVertical !== "ALL") {
      matchesVertical = b.categories?.some((c: any) => c.id === selectedVertical) || false;
    }

    const matchesStatus =
      statusFilter === "ALL" ? true :
      statusFilter === "VERIFIED" ? b.is_verified :
      statusFilter === "DRAFT" ? !b.is_verified : true;

    return matchesSearch && matchesVertical && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-500" />
            Brand Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage verified brands and scope them to root category verticals. Brands with no categories assigned are global.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Register Brand
        </button>
      </div>

      {/* Toolbar: Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brand name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          
          <select
            value={selectedVertical}
            onChange={(e) => setSelectedVertical(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Verticals</option>
            <option value="GLOBAL">🌐 Global (Unscoped)</option>
            {rootCategories.map((rc) => (
              <option key={rc.id} value={rc.id}>{rc.name}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="DRAFT">Pending Review / Draft</option>
          </select>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Brand</th>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category Scope (Roots Only)</th>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-slate-400 text-xs">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-600 animate-spin mx-auto mb-3" />
                    Loading brand registry...
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-slate-400 italic text-xs">No brands match your filter criteria.</td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 overflow-hidden shrink-0 text-sm">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                          ) : (
                            brand.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {brand.name}
                            {brand.name_am && <span className="text-slate-400 text-[10px] font-normal ml-1">({brand.name_am})</span>}
                          </div>
                          {(brand as any).website && (
                            <a href={(brand as any).website} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline truncate max-w-[140px] block">{(brand as any).website}</a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {brand.categories && brand.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {brand.categories.slice(0, 2).map((c: any) => (
                            <span key={c.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-semibold">
                              📁 {c.name}
                            </span>
                          ))}
                          {brand.categories.length > 2 && (
                            <span className="text-[10px] text-slate-400">+{brand.categories.length - 2} more</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                          <Globe className="w-3 h-3" /> Global Platform Brand
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {brand.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(brand)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                          title="Edit Brand"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id, brand.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingBrand ? "Edit Brand" : "Register New Brand"}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Scope to root verticals for category-gated brand filtering.
                </p>
              </div>
              <button
                onClick={() => { setModalOpen(false); resetForm(); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Brand Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <Award className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="logo-upload"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {logoFile ? "Change Logo" : "Upload Logo"}
                    </label>
                    {logoFile && (
                      <p className="text-[10px] text-slate-500 mt-1">{logoFile.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name (English)*</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samsung"
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Name (Amharic)</label>
                  <input
                    type="text" value={nameAm} onChange={(e) => setNameAm(e.target.value)}
                    placeholder="e.g. ሳምሱንግ"
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Website</label>
                <input
                  type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.brand.com"
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Root Category Scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Root Category Scope
                  <span className="ml-2 font-normal text-slate-400">(Leave empty for global)</span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                  Selecting a root category auto-includes all its subcategories and leaf nodes through hierarchical inheritance.
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  {rootCategories.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-2">No root categories available</p>
                  ) : (
                    rootCategories.map((cat) => {
                      const selected = selectedCategoryIds.includes(cat.id);
                      return (
                        <label key={cat.id} className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all text-xs",
                          selected
                            ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60"
                            : "hover:bg-white dark:hover:bg-slate-800 border border-transparent"
                        )}>
                          <div className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                            selected ? "bg-indigo-600 border-indigo-600" : "border-slate-400 dark:border-slate-600"
                          )}>
                            {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <input type="checkbox" checked={selected} onChange={() => toggleCategory(cat.id)} className="sr-only" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white">{cat.name}</div>
                            {cat.name_am && <div className="text-[10px] text-slate-500">{cat.name_am}</div>}
                          </div>
                          {selected && <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                        </label>
                      );
                    })
                  )}
                </div>
                {selectedCategoryIds.length > 0 && (
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1.5 font-semibold">
                    ✓ {selectedCategoryIds.length} root {selectedCategoryIds.length === 1 ? "vertical" : "verticals"} selected — all sub-categories inherit this brand.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {formLoading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> {editingBrand ? "Save Changes" : "Register Brand"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
