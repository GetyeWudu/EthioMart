"use client";

import React, { useState, useEffect } from "react";
import { CategoryNode } from "@/features/products/types";
import { catalogService } from "@/features/products/services/catalog-service";
import { Plus, FolderTree, ChevronRight, ChevronDown, Edit2, LayoutGrid, X, Folder, FolderOpen, FileText, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminTaxonomyPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryNode | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [nameAm, setNameAm] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [icon, setIcon] = useState("");
  const [commissionRate, setCommissionRate] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTree = () => {
    setLoading(true);
    catalogService
      .getCategoryTree()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to load taxonomy tree", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTree();
  }, []);

  // Flatten nodes for parent selector (with circular guard)
  const flattenedNodes = React.useMemo(() => {
    const list: { id: string; name: string; depth: number }[] = [];
    function traverse(node: CategoryNode, path: string) {
      const fullPath = path ? `${path} > ${node.name}` : node.name;
      list.push({ id: node.id, name: fullPath, depth: node.depth });
      if (node.children) node.children.forEach(c => traverse(c, fullPath));
    }
    categories.forEach(c => traverse(c, ""));
    return list;
  }, [categories]);

  const openCreateModal = () => {
    setEditTarget(null);
    setName("");
    setNameAm("");
    setParentId("");
    setIcon("");
    setCommissionRate("");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (node: CategoryNode, currentParentId?: string) => {
    setEditTarget(node);
    setName(node.name);
    setNameAm(node.name_am || "");
    setParentId(currentParentId || "");
    setIcon(node.icon || "");
    setCommissionRate(node.commission_rate_override ? String(node.commission_rate_override) : "");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg(null);

    const commRateVal = commissionRate.trim() ? parseFloat(commissionRate.trim()) : null;

    try {
      if (editTarget) {
        await catalogService.updateCategory(editTarget.id, {
          name: name.trim(),
          name_am: nameAm.trim() || undefined,
          parent_id: parentId || undefined,
          icon: icon.trim() || undefined,
          commission_rate_override: commRateVal,
        });
        toast.success("Category updated successfully!");
      } else {
        await catalogService.createCategory({
          name: name.trim(),
          name_am: nameAm.trim() || undefined,
          parent_id: parentId || undefined,
          icon: icon.trim() || undefined,
          commission_rate_override: commRateVal,
        });
        toast.success("Category created!");
      }
      setModalOpen(false);
      loadTree();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save category node.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? All its children will also be deleted.")) return;
    try {
      await catalogService.deleteCategory(id);
      toast.success("Category deleted.");
      loadTree();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category.");
    }
  };

  const stats = React.useMemo(() => {
    let rootCount = categories.length;
    let totalCount = 0;
    let leafCount = 0;
    let customRateCount = 0;

    function countNodes(nodes: CategoryNode[]) {
      for (const n of nodes) {
        totalCount++;
        if (n.commission_rate_override !== undefined && n.commission_rate_override !== null) {
          customRateCount++;
        }
        if (!n.children || n.children.length === 0) {
          leafCount++;
        } else {
          countNodes(n.children);
        }
      }
    }
    countNodes(categories);

    return { totalCount, rootCount, leafCount, customRateCount };
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-slate-900 dark:text-white">
            Taxonomy & Category Tree
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure hierarchical categories with Materialized Path depth-first indexing and leaf node bounds
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Category Node
        </button>
      </div>

      {/* Taxonomy KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Categories</span>
            <div className="p-2 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.totalCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Hierarchical tree nodes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Root Verticals</span>
            <div className="p-2 rounded-xl text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.rootCount}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Top-level verticals</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leaf Product Nodes</span>
            <div className="p-2 rounded-xl text-blue-600 bg-blue-50 dark:bg-blue-950/50">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.leafCount}
            </span>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">Listing endpoints</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Commission Overrides</span>
            <div className="p-2 rounded-xl text-amber-600 bg-amber-50 dark:bg-amber-950/50">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {stats.customRateCount}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Custom fee rates set</p>
          </div>
        </div>
      </div>

      {/* Tree Visualization Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all" 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider w-[35%]">Category Name</th>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider w-[25%]">Slug</th>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider w-[22%]">Effective Commission</th>
                <th className="px-5 py-3.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider text-right w-[18%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-xs">
                    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading taxonomy tree...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400 italic text-xs">No categories found. Create a root node to get started.</td>
                </tr>
              ) : (
                categories.map((root) => (
                  <RecursiveCategoryNode
                    key={root.id}
                    node={root}
                    onEdit={openEditModal}
                    onDelete={handleDeleteCategory}
                    searchQuery={searchQuery}
                    onCreateChild={(parentId) => {
                      setEditTarget(null);
                      setName("");
                      setNameAm("");
                      setParentId(parentId);
                      setIcon("");
                      setCommissionRate("");
                      setErrorMsg(null);
                      setModalOpen(true);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Node Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editTarget ? "Edit Category Node" : "Create Taxonomy Node"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">{errorMsg}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name (English)*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Ethiopian Wear"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name (Amharic)</label>
                <input
                  type="text"
                  placeholder="e.g. የባህል አልባሳት"
                  value={nameAm}
                  onChange={(e) => setNameAm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-amharic"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent Category</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Root Node (Depth 1) --</option>
                  {flattenedNodes.map((n) => {
                    // Prevent circular dependency: cannot set parent to itself or its children
                    if (editTarget && (n.id === editTarget.id || n.name.includes(editTarget.name))) return null;
                    return (
                      <option key={n.id} value={n.id}>
                        {n.name} (Depth {n.depth})
                      </option>
                    );
                  })}
                </select>
                {editTarget && (
                  <p className="text-[10px] text-gray-500 mt-1">Changing parent will move this node and all its children via Treebeard Materialized Path.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Commission Rate Override (%)
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 6.00 (Leave blank to inherit)"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Leave blank to automatically inherit from parent category or global baseline (10%).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Icon Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. laptop, shirt, home"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                />
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all shadow-xs"
                >
                  {formLoading ? "Saving..." : "Save Category Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface RecursiveCategoryNodeProps {
  node: CategoryNode;
  parentId?: string;
  onEdit: (node: CategoryNode, pId?: string) => void;
  onDelete: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  searchQuery: string;
}

function RecursiveCategoryNode({ node, parentId, onEdit, onDelete, onCreateChild, searchQuery }: RecursiveCategoryNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  const matchesSearch = searchQuery && (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || node.slug.toLowerCase().includes(searchQuery.toLowerCase()));
  
  useEffect(() => {
    if (searchQuery && matchesSearch) {
      setExpanded(true);
    }
  }, [searchQuery, matchesSearch]);

  const show = !searchQuery || matchesSearch || (hasChildren && node.children.some(c => JSON.stringify(c).toLowerCase().includes(searchQuery.toLowerCase())));
  
  if (!show) return null;

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
        <td className="px-5 py-3">
          <div className="flex items-center" style={{ paddingLeft: `${(node.depth - 1) * 1.5}rem` }}>
            {node.depth > 1 && (
               <div className="w-4 h-full border-l border-slate-200 dark:border-slate-700 mr-2 -ml-2" /> 
            )}
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-2">
                {expanded ? <FolderOpen className="w-4 h-4 text-emerald-600" /> : <Folder className="w-4 h-4 text-emerald-600" />}
              </button>
            ) : (
              <div className="p-1 mr-2"><FileText className="w-4 h-4 text-slate-400" /></div>
            )}
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              {node.name}
              {node.is_leaf && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 rounded flex items-center gap-1">Leaf</span>}
            </span>
          </div>
        </td>
        <td className="px-5 py-3 font-mono text-xs text-slate-500">
          /{node.slug}
        </td>
        <td className="px-5 py-3">
          {node.commission_rate_override ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {node.commission_rate_override}% <span className="text-[9px] font-medium text-indigo-500 uppercase tracking-tight">(Direct)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {node.effective_commission_rate || "10.00"}% <span className="text-[9px] text-slate-400 uppercase tracking-tight">(Inherited)</span>
            </span>
          )}
        </td>
        <td className="px-5 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-end gap-1">
            {node.depth < 5 && (
              <button onClick={() => onCreateChild(node.id)} className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors flex items-center gap-1" title="Add Subcategory">
                <Plus className="w-3 h-3" /> Sub
              </button>
            )}
            <button onClick={() => onEdit(node, parentId)} className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors flex items-center gap-1" title="Edit">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(node.id)} className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors flex items-center gap-1" title="Delete">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </td>
      </tr>
      
      {hasChildren && expanded && (
        node.children.map(child => (
          <RecursiveCategoryNode
            key={child.id}
            node={child}
            parentId={node.id}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreateChild={onCreateChild}
            searchQuery={searchQuery}
          />
        ))
      )}
    </>
  );
}
