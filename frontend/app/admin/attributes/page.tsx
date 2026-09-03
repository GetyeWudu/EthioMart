"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Attribute, AttributeType, CategoryNode, AttributeValue } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import {
  Sparkles, Plus, Layers, Link as LinkIcon, Check, AlertCircle, Tag,
  Trash2, Palette, X, ChevronRight, Database, Filter, Search, GripVertical, Edit2
} from "lucide-react";
import { toast } from "sonner";

interface BindingRow {
  id: string;
  category_id: string;
  category_path: string;
  attribute_id: string;
  attribute_name: string;
  attribute_type: string;
  is_required: boolean;
  is_variant_creator: boolean;
  is_filterable: boolean;
}

interface LeafCat { id: string; name: string; }

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [bindings, setBindings] = useState<BindingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bindingsLoading, setBindingsLoading] = useState(true);

  // Layout State
  const [activeAttrId, setActiveAttrId] = useState<string | null>(null);
  const [attrSearch, setAttrSearch] = useState("");
  const [bindingSearch, setBindingSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bindModalOpen, setBindModalOpen] = useState(false);

  // Create Attribute form
  const [attrName, setAttrName] = useState("");
  const [attrNameAm, setAttrNameAm] = useState("");
  const [attrType, setAttrType] = useState<AttributeType>("SELECT");
  const [unit, setUnit] = useState("");

  // Bind form - multi-attribute
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([]);
  const [isVariantCreator, setIsVariantCreator] = useState(true);
  const [isRequired, setIsRequired] = useState(true);
  const [isFilterable, setIsFilterable] = useState(true);
  const [catSearch, setCatSearch] = useState("");

  // Value form
  const [newVal, setNewVal] = useState("");
  const [newValAm, setNewValAm] = useState("");
  const [newValColor, setNewValColor] = useState("#000000");
  const [isColorAttr, setIsColorAttr] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const leafCategories = React.useMemo(() => {
    const list: LeafCat[] = [];
    function traverse(node: CategoryNode, path: string) {
      const fullPath = path ? `${path} > ${node.name}` : node.name;
      if (!node.children || node.children.length === 0) {
        list.push({ id: node.id, name: fullPath });
      } else {
        node.children.forEach((child) => traverse(child, fullPath));
      }
    }
    categories.forEach((root) => traverse(root, ""));
    return list;
  }, [categories]);

  const filteredLeafCats = catSearch
    ? leafCategories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : leafCategories;

  const loadAttributes = useCallback(async () => {
    const attrs = await catalogService.getAttributes();
    setAttributes(attrs);
    return attrs;
  }, []);

  const loadBindings = useCallback(async () => {
    setBindingsLoading(true);
    try {
      const data = await catalogService.getAllCategoryAttributeBindings();
      setBindings(data);
    } catch (err) {
      console.error("Failed to load bindings", err);
    } finally {
      setBindingsLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [attrs, cats] = await Promise.all([
        catalogService.getAttributes(),
        catalogService.getCategoryTree(),
      ]);
      setAttributes(attrs);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
    loadBindings();
  }, [loadBindings]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setErrorMsg(null);
    try {
      await catalogService.createAttribute({
        name: attrName.trim(),
        name_am: attrNameAm.trim() || undefined,
        attribute_type: attrType,
        unit: unit.trim() || undefined,
      });
      setCreateModalOpen(false);
      setAttrName(""); setAttrNameAm(""); setUnit("");
      toast.success("Attribute created!");
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create attribute.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleBindAttributes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || selectedAttrIds.length === 0) {
      setErrorMsg("Please choose a category and at least one attribute.");
      return;
    }
    setFormLoading(true); setErrorMsg(null);
    try {
      await Promise.all(
        selectedAttrIds.map((attrId) =>
          catalogService.bindCategoryAttribute(selectedCatId, attrId, {
            is_variant_creator: isVariantCreator,
            is_required: isRequired,
            is_filterable: isFilterable,
          })
        )
      );
      setBindModalOpen(false);
      setSelectedCatId(""); setSelectedAttrIds([]); setCatSearch("");
      toast.success(`${selectedAttrIds.length} attribute${selectedAttrIds.length > 1 ? "s" : ""} bound successfully!`);
      loadBindings();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to bind attributes.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnbind = async (bindingId: string) => {
    // Optimistic removal
    const prev = [...bindings];
    setBindings((b) => b.filter((x) => x.id !== bindingId));
    try {
      await catalogService.deleteCategoryAttributeBinding(bindingId);
      toast.success("Attribute unbound from category.");
    } catch (err: any) {
      setBindings(prev); // rollback
      toast.error(err.message || "Failed to unbind. Rolled back.");
    }
  };

  const activeAttr = attributes.find((a) => a.id === activeAttrId) || null;

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAttr || !newVal.trim()) return;
    setFormLoading(true); setErrorMsg(null);
    try {
      await catalogService.createAttributeValue(activeAttr.id, {
        value: newVal.trim(),
        value_am: newValAm.trim() || undefined,
        color_code: (isColorAttr || activeAttr.name.toLowerCase().includes("color")) ? newValColor : undefined,
      });
      setNewVal(""); setNewValAm("");
      const updated = await loadAttributes();
      toast.success("Value added!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add value.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteValue = async (attrId: string, valId: string) => {
    try {
      await catalogService.deleteAttributeValue(attrId, valId);
      await loadAttributes();
      toast.success("Value removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete value.");
    }
  };

  const toggleAttrSelection = (id: string) => {
    setSelectedAttrIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const filteredAttributes = attributes.filter((a) => a.name.toLowerCase().includes(attrSearch.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dynamic Attribute Matrix</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define global product specifications, manage value swatches, and bind variant-creators to leaf taxonomy categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setErrorMsg(null); setCreateModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Attribute</span>
          </button>
        </div>
      </div>

      {/* ===== Master-Detail Split Pane ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left Panel: Attributes List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Attributes ({attributes.length})</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search attributes..." 
                value={attrSearch} 
                onChange={(e) => setAttrSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[600px]">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                Loading...
              </div>
            ) : filteredAttributes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">No attributes found.</div>
            ) : (
              filteredAttributes.map((attr) => {
                const isActive = activeAttrId === attr.id;
                const boundCount = bindings.filter(b => b.attribute_id === attr.id).length;
                return (
                  <button
                    key={attr.id}
                    onClick={() => { setActiveAttrId(attr.id); setIsColorAttr(attr.name.toLowerCase().includes("color")); setErrorMsg(null); }}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all border ${
                      isActive 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50" 
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${isActive ? "text-indigo-700 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                        {attr.name} {attr.name_am && <span className="text-[10px] font-normal text-slate-400">({attr.name_am})</span>}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{attr.attribute_type}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{attr.values?.length || 0} values</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span>{boundCount} categories</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Detail Workbench */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col shadow-xs overflow-hidden h-full min-h-[600px]">
          {!activeAttr ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <Tag className="w-12 h-12 mb-4 text-slate-200 dark:text-slate-700" />
              <h3 className="font-bold text-slate-600 dark:text-slate-300">Select an attribute</h3>
              <p className="text-xs max-w-sm text-center mt-2">Choose an attribute from the list to manage its predefined values and category bindings.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Workbench Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-indigo-500" />
                      {activeAttr.name}
                      {activeAttr.name_am && <span className="text-sm font-medium text-slate-400">({activeAttr.name_am})</span>}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Type: {activeAttr.attribute_type}</span>
                      {activeAttr.unit && <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">Unit: {activeAttr.unit}</span>}
                    </div>
                  </div>
                  <button onClick={async () => {
                    const newName = prompt("Enter new attribute name:", activeAttr.name);
                    if (newName && newName !== activeAttr.name) {
                      try {
                        await catalogService.updateAttribute(activeAttr.id, { name: newName });
                        toast.success("Attribute renamed successfully");
                        loadAttributes();
                        setActiveAttrId(activeAttr.id); // Triggers re-render with new name after load
                      } catch (err) {
                        toast.error("Failed to rename attribute");
                      }
                    }
                  }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Edit Metadata">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Workbench Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-8">
                
                {/* Section 1: Values & Swatches */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Values</h3>
                      <p className="text-xs text-slate-500">Manage standard options. Drag to reorder.</p>
                    </div>
                  </div>
                  
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                    <div className="p-2.5 space-y-1.5 max-h-[300px] overflow-y-auto">
                      {activeAttr.values && activeAttr.values.length > 0 ? (
                        activeAttr.values.map((v, i) => (
                          <div key={v.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg group">
                            <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing" />
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">{v.value}</span>
                              <span className="text-xs text-slate-500">{v.value_am || "-"}</span>
                            </div>
                            <button onClick={() => handleDeleteValue(activeAttr.id, v.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                          {activeAttr.attribute_type === "TEXT" || activeAttr.attribute_type === "NUMBER" ? "Free input attribute. No predefined values required." : "No values configured. Add one below."}
                        </div>
                      )}
                    </div>
                    
                    {/* Add Value Form Inline */}
                    {(activeAttr.attribute_type !== "TEXT" && activeAttr.attribute_type !== "NUMBER") && (
                      <form onSubmit={handleAddValue} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[150px]">
                          <input type="text" required placeholder="New Value (English)" value={newVal} onChange={(e) => setNewVal(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <input type="text" placeholder="Amharic (Optional)" value={newValAm} onChange={(e) => setNewValAm(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <button type="submit" disabled={formLoading || !newVal.trim()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Section 2: Scoped Category Bindings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bound Categories</h3>
                      <p className="text-xs text-slate-500">Categories where this attribute is available.</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedAttrIds([activeAttr.id]); setBindModalOpen(true); }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Bind to Category
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[300px] overflow-y-auto">
                      {bindings.filter(b => b.attribute_id === activeAttr.id).length > 0 ? (
                        bindings.filter(b => b.attribute_id === activeAttr.id).map(b => (
                          <li key={b.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400">
                                {b.category_path.split(" > ").slice(0, -1).join(" › ")} 
                                {b.category_path.split(" > ").length > 1 && " › "}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">{b.category_path.split(" > ").pop()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {b.is_variant_creator && <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded">Variant Creator</span>}
                              <button onClick={() => { if(confirm(`Unbind from ${b.category_path.split(" > ").pop()}?`)) handleUnbind(b.id); }} className="text-slate-400 hover:text-rose-600 transition-colors" title="Unbind">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="p-4 text-center text-xs text-slate-400 italic">Not bound to any categories.</li>
                      )}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Bound Category Attributes Matrix Table ===== */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Bound Category Attributes</h2>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-full text-[10px] font-bold">
              {bindings.length} bindings
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filter bindings..." 
                value={bindingSearch} 
                onChange={(e) => setBindingSearch(e.target.value)}
                className="w-64 pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" 
              />
            </div>
            <button
              onClick={() => { setErrorMsg(null); setBindModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Binding
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 table-fixed">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider w-[38%]">Category Path</th>
                  <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider w-[24%]">Attribute</th>
                  <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider w-[14%]">Variant Creator</th>
                  <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider w-[14%]">Policy</th>
                  <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-right w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {bindingsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-xs">
                      <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mx-auto mb-2" />
                      Loading bindings...
                    </td>
                  </tr>
                ) : bindings.filter(b => b.category_path.toLowerCase().includes(bindingSearch.toLowerCase()) || b.attribute_name.toLowerCase().includes(bindingSearch.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 italic text-xs">
                      No bindings found.
                    </td>
                  </tr>
                ) : (
                  bindings.filter(b => b.category_path.toLowerCase().includes(bindingSearch.toLowerCase()) || b.attribute_name.toLowerCase().includes(bindingSearch.toLowerCase())).map((binding, i) => {
                    const pathParts = binding.category_path.split(" > ");
                    const leaf = pathParts.pop();
                    const rootPath = pathParts.join(" › ");
                    
                    return (
                      <tr key={binding.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${i % 2 === 0 ? "" : "bg-slate-50/40 dark:bg-slate-800/20"}`}>
                        <td className="px-5 py-3.5 truncate" title={binding.category_path}>
                          <div className="flex flex-col">
                            {rootPath && <span className="text-[10px] text-slate-500 truncate">{rootPath}</span>}
                            <span className="font-semibold text-slate-900 dark:text-white truncate">{leaf}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 truncate" title={binding.attribute_name}>
                          <div className="font-semibold text-slate-900 dark:text-white truncate">{binding.attribute_name}</div>
                          <div className="text-[10px] text-slate-400">{binding.attribute_type}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {binding.is_variant_creator ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-md text-[10px] font-bold">
                              <Layers className="w-3 h-3" /> Variant Creator
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md text-[10px] font-medium">Spec Only</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {binding.is_required ? (
                              <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">Required</span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500">Optional</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {binding.is_filterable && (
                              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"><Filter className="w-3 h-3" /> Indexed</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Unbind "${binding.attribute_name}" from "${binding.category_path}"?`)) {
                                handleUnbind(binding.id);
                              }
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Unbind Attribute"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>



      {/* ===== Create Attribute Modal ===== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New Attribute</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreateAttribute} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Attribute Name (English)*</label>
                <input type="text" required placeholder="e.g. Storage Capacity, Shoe Size, Color" value={attrName} onChange={(e) => setAttrName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Attribute Name (Amharic)</label>
                <input type="text" placeholder="e.g. የመጠን ልክ, ቀለም" value={attrNameAm} onChange={(e) => setAttrNameAm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Attribute Type*</label>
                <select value={attrType} onChange={(e) => setAttrType(e.target.value as AttributeType)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                  <option value="SELECT">Single Select (Color, Size, Option)</option>
                  <option value="MULTI_SELECT">Multi-Select</option>
                  <option value="TEXT">Free Text</option>
                  <option value="NUMBER">Numeric</option>
                  <option value="BOOLEAN">Boolean (Yes/No)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit (Optional)</label>
                <input type="text" placeholder="e.g. GB, cm, kg, mAh" value={unit} onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-all">
                  {formLoading ? "Creating..." : "Save Attribute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Bind Category Modal (Multi-attribute) ===== */}
      {bindModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Bind Attributes to Category</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select a leaf category and one or more attributes to bind.</p>
              </div>
              <button onClick={() => { setBindModalOpen(false); setSelectedAttrIds([]); setSelectedCatId(""); setCatSearch(""); setErrorMsg(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBindAttributes} className="space-y-4">
              {/* Step 1: Target Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Step 1: Target Leaf Category*
                </label>
                <input
                  type="text" placeholder="Search categories..." value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none mb-2"
                />
                <select required value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500" size={5}>
                  <option value="">-- Choose Leaf Category --</option>
                  {filteredLeafCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Attributes multi-select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Step 2: Attributes to Bind* <span className="font-normal text-slate-400">({selectedAttrIds.length} selected)</span>
                </label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  {attributes.map((a) => {
                    const selected = selectedAttrIds.includes(a.id);
                    return (
                      <label key={a.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${selected ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "bg-indigo-600 border-indigo-600" : "border-slate-400 dark:border-slate-600"}`}>
                          {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" checked={selected} onChange={() => toggleAttrSelection(a.id)} className="sr-only" />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{a.name}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{a.attribute_type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Batch Configuration */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
                <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Step 3: Batch Configuration (applied to all selected)</p>
                {[
                  { label: "Variant Creator", desc: "Expands into Color/Size purchasable SKUs", val: isVariantCreator, set: setIsVariantCreator },
                  { label: "Mandatory Spec", desc: "Enforced by Auto-Approval Engine", val: isRequired, set: setIsRequired },
                  { label: "Faceted Search Filter", desc: "Indexed on Storefront catalog sidebar", val: isFilterable, set: setIsFilterable },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={item.val} onChange={(e) => item.set(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600" />
                    <span><strong>{item.label}</strong> — {item.desc}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => { setBindModalOpen(false); setSelectedAttrIds([]); setSelectedCatId(""); setErrorMsg(null); }}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={formLoading || selectedAttrIds.length === 0 || !selectedCatId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5">
                  {formLoading ? (
                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Binding...</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> Bind {selectedAttrIds.length > 0 ? `${selectedAttrIds.length} ` : ""}Attribute{selectedAttrIds.length !== 1 ? "s" : ""}</>
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
