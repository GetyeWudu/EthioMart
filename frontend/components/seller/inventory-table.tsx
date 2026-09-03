"use client";

import { useState } from "react";
import { useSellerStore } from "@/stores/seller-store";
import { Search, SlidersHorizontal, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function InventoryTable() {
  const { products } = useSellerStore();
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-[350px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto border-slate-200 dark:border-slate-800">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="w-[300px] font-semibold text-slate-600 dark:text-slate-300">Product</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300">SKU</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-right">Available Stock</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-right">Reserved</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 text-center">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const isLowStock = product.stock > 0 && product.stock <= 20;
                const isOutOfStock = product.stock === 0;

                return (
                  <TableRow key={product.id} className="border-slate-200 dark:border-slate-800 group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium text-xs">No img</div>
                          )}
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{product.name}</span>
                          <span className="text-xs text-slate-500 truncate">{product.category}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                        {product.sku}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={
                        isOutOfStock ? "text-rose-600 dark:text-rose-500 font-bold" : 
                        isLowStock ? "text-amber-600 dark:text-amber-500 font-bold" : 
                        "text-slate-900 dark:text-slate-100"
                      }>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                      {Math.floor(Math.random() * 5)} {/* Dummy reserved stock */}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={isOutOfStock ? "destructive" : "secondary"}
                        className={
                          isOutOfStock ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900" :
                          isLowStock ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900 hover:bg-amber-100" :
                          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900 hover:bg-emerald-100"
                        }
                      >
                        {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                          <span className="sr-only">Open menu</span>
                          <Edit2 className="h-4 w-4 text-slate-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
                          <DropdownMenuItem>View History</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50">Mark Out of Stock</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
