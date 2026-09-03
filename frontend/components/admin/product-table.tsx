import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";

const PRODUCTS = [
  { id: "P1", store: "TechHaven", name: "Premium Wireless Headphones", category: "Electronics", price: 299.99, status: "Active", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop" },
  { id: "P2", store: "TechHaven", name: "Minimalist Mechanical Keyboard", category: "Electronics", price: 129.99, status: "Active", image: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=200&auto=format&fit=crop" },
  { id: "P3", store: "Minimalist Desk", name: "Ergonomic Office Chair", category: "Furniture", price: 199.50, status: "Flagged", image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=200&auto=format&fit=crop" },
];

export function ProductTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 gap-4 bg-slate-50 dark:bg-slate-900/50">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Global Product Catalog</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and moderate all products listed on the platform.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Product Details</th>
              <th className="px-6 py-4 font-medium">Store</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Global Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {PRODUCTS.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white line-clamp-2 max-w-[200px]">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-medium">{product.store}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{product.category}</td>
                <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <Badge variant={product.status === "Active" ? "default" : "destructive"} className={product.status === "Active" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>
                    {product.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
