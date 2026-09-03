"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Tag, X, Search } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function PromotionForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    coupon_code: initialData?.coupon_code || "",
    discount_type: initialData?.discount_type || "PERCENTAGE",
    discount_value: initialData?.discount_value || "",
    scope_type: initialData?.scope_type || "STORE",
    starts_at: initialData?.starts_at ? new Date(initialData.starts_at).toISOString().slice(0, 16) : "",
    expires_at: initialData?.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : "",
    is_active: initialData?.is_active ?? true,
    is_coupon_required: initialData?.is_coupon_required ?? false,
    scope_products: initialData?.scope_products || [],
    scope_categories: initialData?.scope_categories || [],
  });

  const { data: productsData } = useSWR('/seller/products/', fetcher);
  const products = productsData?.results || productsData || [];
  
  const { data: categoriesData } = useSWR('/catalog/categories/root/', fetcher);
  const categories = categoriesData?.results || categoriesData || [];

  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        coupon_code: initialData.coupon_code || "",
        discount_type: initialData.discount_type || "PERCENTAGE",
        discount_value: initialData.discount_value || "",
        scope_type: initialData.scope_type || "STORE",
        starts_at: initialData.starts_at ? new Date(initialData.starts_at).toISOString().slice(0, 16) : "",
        expires_at: initialData.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : "",
        is_active: initialData.is_active ?? true,
        is_coupon_required: initialData.is_coupon_required ?? false,
        scope_products: initialData.scope_products || [],
        scope_categories: initialData.scope_categories || [],
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === "radio" ? value === "true" : value
    }));
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      scope_products: prev.scope_products.includes(productId) 
        ? prev.scope_products.filter((id: string) => id !== productId)
        : [...prev.scope_products, productId]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      scope_categories: prev.scope_categories.includes(categoryId) 
        ? prev.scope_categories.filter((id: string) => id !== categoryId)
        : [...prev.scope_categories, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };
      
      if (!formData.is_coupon_required) {
        payload.coupon_code = null;
      }
      
      if (initialData?.id) {
        await api.patch(`/seller/promotions/${initialData.id}/`, payload);
      } else {
        await api.post('/seller/promotions/', payload);
      }
      router.push('/seller/promotions');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save promotion. Please check details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p: any) => p.title.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredCategories = categories.filter((c: any) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Promotion Details</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Promotion Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Summer Sale 2026" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
            
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Label>Promotion Mode</Label>
              <div className="flex flex-col gap-3">
                <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${!formData.is_coupon_required ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                  <input 
                    type="radio" 
                    name="is_coupon_required" 
                    checked={!formData.is_coupon_required}
                    onChange={() => setFormData(prev => ({ ...prev, is_coupon_required: false }))}
                    className="mt-1 shrink-0 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                  />
                  <div>
                    <div className="font-medium text-sm text-slate-900 dark:text-white">Automatic Discount</div>
                    <p className="text-xs text-slate-500 mt-1">Applied directly to product cards as a strike-through price. No code needed by customer.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.is_coupon_required ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                  <input 
                    type="radio" 
                    name="is_coupon_required" 
                    checked={formData.is_coupon_required}
                    onChange={() => setFormData(prev => ({ ...prev, is_coupon_required: true }))}
                    className="mt-1 shrink-0 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                  />
                  <div>
                    <div className="font-medium text-sm text-slate-900 dark:text-white">Coupon Code</div>
                    <p className="text-xs text-slate-500 mt-1">Requires customer to type code at checkout.</p>
                  </div>
                </label>
              </div>
            </div>
            
            {formData.is_coupon_required && (
              <div className="space-y-2">
                <Label htmlFor="coupon_code">Discount Code</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input 
                    id="coupon_code" 
                    name="coupon_code" 
                    required={formData.is_coupon_required}
                    value={formData.coupon_code} 
                    onChange={handleChange} 
                    placeholder="SUMMER26" 
                    className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 uppercase" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="scope_type">Promotion Scope</Label>
              <select 
                id="scope_type" 
                name="scope_type"
                value={formData.scope_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="STORE">Store-Wide</option>
                <option value="PRODUCT">Specific Products</option>
                <option value="CATEGORY">Specific Categories</option>
              </select>
            </div>

            {formData.scope_type === 'PRODUCT' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label>Select Products</Label>
                
                {formData.scope_products.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.scope_products.map((id: string) => {
                      const p = products.find((p:any) => p.id === id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-medium">
                          <span className="truncate max-w-[150px]">{p.title}</span>
                          <button type="button" onClick={() => toggleProduct(id)} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <Input 
                      value={productSearch} 
                      onChange={(e) => setProductSearch(e.target.value)} 
                      placeholder="Search products..." 
                      className="border-0 shadow-none focus-visible:ring-0 bg-transparent" 
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {filteredProducts.map((p: any) => (
                      <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={formData.scope_products.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <div className="flex-1 flex items-center gap-3">
                          {p.primary_image && (
                            <img src={p.primary_image.image_url} alt="" className="h-8 w-8 rounded object-cover bg-white" />
                          )}
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">{p.title}</span>
                        </div>
                      </label>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">No products found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.scope_type === 'CATEGORY' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label>Select Categories</Label>
                
                {formData.scope_categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.scope_categories.map((id: string) => {
                      const c = categories.find((c:any) => c.id === id);
                      if (!c) return null;
                      return (
                        <div key={id} className="flex items-center gap-1 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 px-2.5 py-1 rounded-full text-xs font-medium">
                          <span>{c.name}</span>
                          <button type="button" onClick={() => toggleCategory(id)} className="hover:text-fuchsia-900 dark:hover:text-fuchsia-100">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <Input 
                      value={categorySearch} 
                      onChange={(e) => setCategorySearch(e.target.value)} 
                      placeholder="Search categories..." 
                      className="border-0 shadow-none focus-visible:ring-0 bg-transparent" 
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                    {filteredCategories.map((c: any) => (
                      <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={formData.scope_categories.includes(c.id)}
                          onChange={() => toggleCategory(c.id)}
                          className="rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-600"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{c.name}</span>
                      </label>
                    ))}
                    {filteredCategories.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">No categories found.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Discount Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="discount_type">Discount Type</Label>
              <select 
                id="discount_type" 
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (ETB)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_value">Discount Value</Label>
              <Input id="discount_value" name="discount_value" value={formData.discount_value} onChange={handleChange} required type="number" step="0.01" placeholder="20" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Schedule</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Start Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <Input id="starts_at" name="starts_at" value={formData.starts_at} onChange={handleChange} type="datetime-local" className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">End Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <Input id="expires_at" name="expires_at" value={formData.expires_at} onChange={handleChange} type="datetime-local" className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="radio" id="promo-active" name="is_active" value="true" checked={formData.is_active === true} onChange={handleChange} className="text-indigo-600" />
              <Label htmlFor="promo-active">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="radio" id="promo-draft" name="is_active" value="false" checked={formData.is_active === false} onChange={handleChange} className="text-indigo-600" />
              <Label htmlFor="promo-draft">Draft</Label>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? "Saving..." : initialData?.id ? "Save Changes" : "Save Promotion"}
            </Button>
            {initialData?.id && (
              <Button type="button" variant="destructive" className="w-full" onClick={async () => {
                if (confirm('Are you sure you want to delete this promotion?')) {
                  await api.delete(`/seller/promotions/${initialData.id}/`);
                  router.push('/seller/promotions');
                }
              }}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
